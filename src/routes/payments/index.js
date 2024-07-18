const request = require('request');
const express = require('express')
const router = express.Router()

const { uuid } = require('uuidv4');

const JWT = require("@utils/jwt")

const { JWT_TOKEN, KEY_BAAS,BAAS_URL } = process.env

const Payments = require("@models/Payments")
const Clients = require("@models/Clients")

function API(config) {
    return new Promise(resolve => {
        request(config, (error, retorno, d1) => resolve(d1))
    })
}

setInterval(async() => {
    
    return
    //in manitance
    let PaymentList = await Payments.findAll({where:{status:'pending'}})
    
    for (let index = 0; index < PaymentList.length; index++) {
        const {payment_id,company,amount,createdAt,expirationDate} = PaymentList[index].dataValues;
        
        let getPaymentStatus = await API({
            url:`https://${BAAS_URL}/api/v1/transactions/${payment_id}`,
            headers:{
                "authorization":KEY_BAAS,
                "content-type":"application/json"  
            },
            method:"GET"
        })
        getPaymentStatus = JSON.parse(getPaymentStatus)

        let { status,paidAmount } = getPaymentStatus.data

        if(new Date() > new Date(expirationDate)){
            await Payments.update({status:'canceled'},{where:{payment_id}})
        }


        if(status == "paid" && (amount*100) == paidAmount){
            await Payments.update({status:'paid'},{where:{payment_id}})

            const company = Clients.findOne({company_hash:company})
            const {balance,mail} = company.dataValues.balance
            balance = balance - (amount * 0.06) - 2.50
            await Clients.update({balance},{where:{company:company}})
            console.log(`[+] Novo pagamento contabilizado - ${id} - ${company} - R$:${amount},00`)
        }

        console.log(payment_id,company,amount,createdAt,expirationDate)
    }
}, 15000);

/* Generate payment */
router.post('/payments', async function(req,res){

    try{

        const { documentnumber,customername,email,amount} = req.body
        const authorization = req.headers['authorization'];

        if(!documentnumber || !customername || !email || !amount || !authorization)
            return res.status(400).json({success:false, error:true, message: "need params",params:{documentnumber,customername,email,amount,authorization}}); 


        const company_hashdec = Buffer.from(authorization, 'base64').toString('utf-8').split(':')[0]
        if(!company_hashdec)
            return res.status(403).json({success:false, error:true, message: "Invalid company"}); 
    
        const company_find = await Clients.findOne({where:{company_hash:company_hashdec}})
        if(!company_find)
            return res.status(403).json({success:false, error:true, message: "Company not found"}); 
        
        const {document, name, mail} = company_find.dataValues

        let generatePayment = await API({
            url:`https://${BAAS_URL}/api/v1/transactions`,
            headers:{
                "authorization":KEY_BAAS,
                "content-type":"application/json"  
            },
            method:"POST",
            body:JSON.stringify({
                "customer": {
                  "document": {
                    "number": document,
                    "type": "cpf"
                  },
                  "name": name,
                  "email": mail
                },
                "pix": {
                    "expiresInDays": 1
                },
                "amount": amount * 100,
                "paymentMethod": "pix",
                "items": [
                  {
                    "tangible": false,
                    "title": "Payment",
                    "unitPrice": amount * 100,
                    "quantity": 1
                  }
                ]
              })
        })

        generatePayment = JSON.parse(generatePayment)
        if(!generatePayment.data)
            return res.status(403).json({success:false, error:true, message: "Payment not inicialaized"});
       
        const { id,status, pix } = generatePayment.data
        
        if(!id)
            return res.status(403).json({success:false, error:true, message: "Payment not inicialaized"});
 
        const paymentSave = await Payments.create({payment_id:id,amount,payer_name:customername,payer_document:documentnumber,commit:"Comentário",company:company_hashdec,qrcode:pix.qrcode,expirationDate:pix.expirationDate})
        await paymentSave.save()

        let imageQRCODE = await API({
            url:`https://api.qrserver.com/v1/create-qr-code/?data=${pix.qrcode}&amp;size=200x200`,
            method:"GET",
            encoding: null
        })
        pix.image = `data:image/png;base64,${Buffer.from(imageQRCODE).toString('base64')}`;

        const payload = {
            id,
            status,
            amount,
            pix,
            costumer:{
                document, 
                name,
                mail
            }
        }

        return res.status(200).json({success:true, message:"Payment created", payload});

    }catch(err){
        console.error(err)
        return res.status(400).json({success:false, error:true, message: "Please contact support"});
    }
})


/* Search specific payment */
router.get('/payments/:id', async function(req,res){

    try{
        // const authorization = req.headers['authorization'];

        const transaction_id = req.params.id

        if(!transaction_id)
            return res.status(400).json({success:false, error:true, message: "need params"}); 

        let getPaymentStatus = await API({
            url:`https://${BAAS_URL}/api/v1/transactions/${transaction_id}`,
            headers:{
                "authorization":KEY_BAAS,
                "content-type":"application/json"  
            },
            method:"GET"
        })
        getPaymentStatus = JSON.parse(getPaymentStatus)
        if(!getPaymentStatus.data)
            return res.status(400).json({success:false, error:true, message: "Payment id not found"});

        let { status,id,amount,paidAmount,createdAt } = getPaymentStatus.data

        const paymentData = await Payments.findOne({where:{payment_id:transaction_id}})
        if(!paymentData)
            return res.status(400).json({success:false, error:true, message: "Payment id not found"});
 
        const {payer_name, payer_document} = paymentData.dataValues

        return res.status(200).json({success:true, result:{id,status,amount,payer_name,payer_document,createdAt}});
        
    }catch(err){
        console.error(err)
        return res.status(403).json({success:false, error:true, message: "Please contact support"});
    }
})

module.exports = router;