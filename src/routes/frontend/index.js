const express = require("express");
const router = express.Router()
const { Op } = require('sequelize');

const fs = require('fs')

const Clients = require("@models/Clients")
const CompanyRequest = require("@models/CompanyRequest")
const Payments = require("@models/Payments")

const API = require("@utils/request")

const JWT = require("@utils/jwt")

const { uuid } = require('uuidv4');

const { JWT_TOKEN,API_HOST,API_BACKEND } = process.env

// Função para formatar a data para o início do mês & fim do mês
const startOfMonth = date => new Date(date.getFullYear(), date.getMonth(), 1);
const endOfMonth = date => new Date(date.getFullYear(), date.getMonth() + 1, 0);

/* Routes frontend */
router.get('/', async(req, res) => {

    try{
        let accessToken = req.cookies['access_token'];
        
        if(accessToken){
            accessToken = accessToken.split('"').join('')
            let _TOKEN = await JWT.VERIFY(accessToken,JWT_TOKEN)
            if(_TOKEN.status)
                return res.redirect('/app/dashboard');
        }
    
        return res.render('index', {title:"Cloud Payments"});
    }catch(err){
        console.error(err)
        return res.render('index', {title:"Cloud Payments"});
    }
});

/* Dashboard route */

router.get('/app/dashboard', async(req, res) => {

    try{
        let accessToken = req.cookies['access_token'];
        if(!accessToken) return res.redirect('/logout');

        accessToken = accessToken.split('"').join('')

        if(!accessToken)
            return res.redirect('/logout');
        
        let _TOKEN = await JWT.VERIFY(accessToken,JWT_TOKEN)
        if(!_TOKEN.status)
            return res.redirect('/logout');

        console.log(_TOKEN.data)

        const company_hash = _TOKEN.data.company_hash;

        const Client = await Clients.findOne({ where: { company_hash } });

        const { balance } = Client.dataValues;

        const today = new Date();

        const payments = await Payments.findAll({
            where: {
                status:"paid",
                company: company_hash,
                createdAt: {
                    [Op.between]: [startOfMonth(today), endOfMonth(today)]
                }
            }
        });

        let dailyIncome = 0;
        let monthlyIncome = 0;

        payments.forEach(payment => {
            const date = payment.createdAt.toISOString().split('T')[0]; // yyyy-mm-dd
            const amount = parseFloat(payment.amount); // Certifique-se de que amount é um número

            if (!dailyIncome) {
                dailyIncome = 0;
            }
            dailyIncome += amount;
            monthlyIncome += amount;
        });

        res.render('app/dashboard', {title:"Dashboard",userBalance:getCurrency(balance),DailyValue:getCurrency(dailyIncome),MounthValue:getCurrency(monthlyIncome)});
    } catch (error) {
        console.error('Erro ao obter a renda:', error);
        return res.redirect('/logout');
    }
});

/* Pix route */
router.get('/app/pix', async(req, res) => {
    let accessToken = req.cookies['access_token'];
    if(!accessToken) return res.redirect('/logout');

    accessToken = accessToken.split('"').join('')

    if(!accessToken)
        return res.redirect('/logout');
    
    let _TOKEN = await JWT.VERIFY(accessToken,JWT_TOKEN)
    if(!_TOKEN.status)
        return res.redirect('/logout');

    const company_hash = _TOKEN.data.company_hash;
    const query = await Clients.findOne({where:{company_hash}})

    let { topt } = query.dataValues
    if(!topt || topt && topt.split("|")[2] != "true")
        return res.redirect('./settings');

    res.render('app/pix', {title:"Transferência Pix"});
});

/* Settings route */
router.get('/app/settings', async(req, res) => {
    let accessToken = req.cookies['access_token'];
    if(!accessToken) return res.redirect('/logout');

    accessToken = accessToken.split('"').join('')

    if(!accessToken)
        return res.redirect('/logout');
    
    let _TOKEN = await JWT.VERIFY(accessToken,JWT_TOKEN)
    if(!_TOKEN.status)
        return res.redirect('/logout');

    const company_hash = _TOKEN.data.company_hash;
    const query = await Clients.findOne({where:{company_hash}})

    let { topt } = query.dataValues

    let totpcolor = topt ? "green":"red"
    totpstatus = topt ? "Ativado":"Desativado"

    if(topt && topt.split("|")[2] == "pending"){
        totpstatus = "Pendente"
        totpcolor = "yellow"
    }
    console.log(topt)

    console.log(totpcolor)
    res.render('app/settings', {title:"Segurança",totpcolor, totpstatus});
});

/* Integrations route */
router.get('/app/integrations', async(req, res) => {
    let accessToken = req.cookies['access_token'];
    if(!accessToken) return res.redirect('/logout');

    accessToken = accessToken.split('"').join('')

    if(!accessToken)
        return res.redirect('/logout');
    
    let _TOKEN = await JWT.VERIFY(accessToken,JWT_TOKEN)
    if(!_TOKEN.status)
        return res.redirect('/logout');

    const company_hash = _TOKEN.data.company_hash;
    const query = await Clients.findOne({where:{company_hash}})

    let { topt } = query.dataValues
    if(!topt || topt && topt.split("|")[2] != "true")
        return res.redirect('./settings');


    res.render('app/integrations', {title:"Integrações"});
});

/* Details route */
router.get('/app/details/:id', async(req, res) => {

    try{

        const transaction_id = req.params.id
        let accessToken = req.cookies['access_token'];
        if(!accessToken) return res.redirect('/logout');

        accessToken = accessToken.split('"').join('')

        if(!accessToken)
            return res.redirect('/logout');
        
        let _TOKEN = await JWT.VERIFY(accessToken,JWT_TOKEN)
        if(!_TOKEN.status)
            return res.redirect('/logout');

        console.log(`https://${API_HOST}/api/v1/payments/${transaction_id}`)
        let getPaymentStatus = await API({
            url:`https://${API_HOST}/api/v1/payments/${transaction_id}`,
            headers:{
                "content-type":"application/json"  
            },
            method:"GET"
        })
        getPaymentStatus = JSON.parse(getPaymentStatus)
        let {amount,createdAt,id,payer_document,payer_name,status} = getPaymentStatus.result
        amount = getCurrency(parseFloat((amount / 100)))

        res.render('app/details', {id,amount,status,payer_name,payer_document,createdAt: new Intl.DateTimeFormat('pt-BR').format(new Date(createdAt)),});
    }catch(err){
        console.error(err)
        return res.redirect('./');

    }
});

/* Register route */
router.get('/app/register', (req, res) => {
    res.render('app/register', {title:"Registrar Empresa"});
});

/* Login route */
router.get('/app', (req, res) => {
    res.render('app/index', {title:"Login"});
});

/* Logout route */
router.get('/logout', (req, res) => {
    res.clearCookie('access_token');
    res.redirect('/');
});

/*Admin Route */

/* Login route */
router.get('/admin/', async(req, res) => {
    res.render('admin/index', {title:"Login"});
});
router.get('/admin/dashboard', async(req, res) => {


    let today = new Date()
    const payments = await Payments.findAll({
        where: {
            createdAt: {
                [Op.between]: [startOfMonth(today), endOfMonth(today)]
            }
        }
    });

    let totalBalance = await Clients.sum('balance', {
        where: {
            createdAt: {
                [Op.between]: [startOfMonth(today), endOfMonth(today)]
            }
        }
    });
    

    let dailyIncome = 0;
    let monthlyIncome = 0;

    payments.forEach(payment => {
        const date = payment.createdAt.toISOString().split('T')[0];
        const amount = parseFloat(payment.amount);

        if (!dailyIncome) {
            dailyIncome = 0;
        }
        dailyIncome += amount;
        monthlyIncome += amount;
    });

    totalBalance = getCurrency(totalBalance),
    dailyIncome = getCurrency(dailyIncome)
    monthlyIncome = getCurrency(monthlyIncome)

    const pays = await Payments.findAll({order: [['createdAt', 'DESC']]})

    res.render('admin/dashboard', {title:"Dashboard",totalBalance,dailyIncome,monthlyIncome,pays});
});

/* Details route */
router.get('/admin/details/:id', async(req, res) => {

    try{

        const transaction_id = req.params.id
        if(!transaction_id){
            return res.redirect('/admin/dashboard');
        }
 
        let getPaymentStatus = await API({
            url:`https://${API_HOST}/api/v1/payments/${transaction_id}`,
            headers:{
                "content-type":"application/json"  
            },
            method:"GET",
        })
        getPaymentStatus = JSON.parse(getPaymentStatus)

        if(getPaymentStatus.error)
            return res.redirect('/admin/dashboard');

        let {amount,createdAt,id,payer_document,payer_name,status} = getPaymentStatus.result
        amount = getCurrency(parseFloat((amount / 100)))

        res.render('admin/details', {title:`Detalhes ${transaction_id}`,id,amount,status,payer_name,payer_document,createdAt: new Intl.DateTimeFormat('pt-BR').format(new Date(createdAt)),});
    }catch(err){
        console.error(err)
        return res.redirect('/admin/dashboard');

    }
});

router.get('/admin/clients', async(req, res) => {
    const clients = await Clients.findAll({attributes: { exclude: ['password','topt'] }})
    res.render('admin/clients', { title: "Clientes", clients: clients });
});

router.get('/admin/user/:id', async(req, res) => {
    try{
        const requests = await Clients.findOne({where:{id:req.params.id}, attributes:{exclude:['password']}})
        
        if(!requests)
            return res.redirect('/admin/clients')

        const result = requests.dataValues

        console.log(result.company_hash)
        const pays = await Payments.findAll({where:{company:result.company_hash},order: [['createdAt', 'DESC']],limit:5})

        console.log(pays)
        res.render('admin/user', {title:`Cadastro ${result.name}`,requests:result,pays});
    }catch(err){
        console.error(err)
        return res.redirect('/admin/clients')
    }
});

router.get('/admin/requests', async(req, res) => {

    const requests = await CompanyRequest.findAll({order: [['createdAt', 'DESC']],attributes: { exclude: ['password','topt'] }})
    res.render('admin/requests', {title:"Solicitações",requests});
});

router.get('/admin/request/:id', async(req, res) => {

    try{
        const requests = await CompanyRequest.findOne({where:{id:req.params.id}, attributes:{exclude:['password']}})
        
        if(!requests)
            return res.redirect('/admin/requests')

        const result = requests.dataValues

        const front_document = `data:image/jpeg;base64,${fs.readFileSync(`uploads/${result.document}-frente.png`,'base64')}`;
        const back_document = `data:image/jpeg;base64,${fs.readFileSync(`uploads/${result.document}-verso.png`,'base64')}`;
        const images = {
            front_document,
            back_document
        }

        console.log(images)

        res.render('admin/request', {title:`Solicitação ${result.name}`,requests:result,images});
    }catch(err){
        console.error(err)
        return res.redirect('/admin/requests')
    }
});

function getCurrency(amount){
    if(!amount) amount = 0
    return amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

module.exports = router