const express = require("express");
const router = express.Router()
const speakeasy = require('speakeasy');
const { uuid } = require('uuidv4')

const { Op } = require('sequelize')

const multer = require('multer');
const path = require('path');

const Administrator = require("@models/Administrators")
const Clients = require("@models/Clients")
const CompanyRequest = require("@models/CompanyRequest")
const CompanyRejected = require("@models/CompanyRejected")
const Payments = require("@models/Payments")

const API = require("@utils/request")
const JWT = require("@utils/jwt")
const BCRYPT = require("@utils/bcrypt")
const smtp = require("@utils/smtp")
const CRYPTO = require("@utils/crypto")

const { JWT_TOKEN,JWT_ADMIN, HASH_SECRET } = process.env

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const cpf = req.body.cpf.replace(/\D/g, ''); // Remover caracteres não numéricos do CPF
        const ext = path.extname(file.originalname);
        const baseName = file.fieldname === 'documentFront' ? 'frente' : 'verso';
        cb(null, `${cpf}-${baseName}.png`);
    },
});

const upload = multer({ storage });


/* Register route */
router.post('/register', upload.fields([{ name: 'documentFront' }, { name: 'documentBack' }]), async(req, res) => {

    try{
        let {fullName,email,password,phone,cpf,cep,city,state,address,companyName,income} = req.body
        const document = cpf.replace(/\D/g, '');

        const client = await Clients.findOne({where: {[Op.or]: [{ document: document },{ mail: email }]}});
        if(client)
            return res.status(403).json({success:false,message:"Account already registred"})
    
        const companyQuery = await CompanyRequest.findOne({where: {[Op.or]: [{ document: document },{ mail: email }]}});

        if(companyQuery)
            return res.status(403).json({success:false,message:"Account already awaiting approval"})
        password = await BCRYPT.SALT(String(password))

        const companyCreate = await CompanyRequest.create({mail:email,password,document,name:fullName,phone,state,city,address,zipcode:cep,company:companyName,income})
        await companyCreate.save()

        const context = {
            nome: 'Analise de Dados',
            empresa: 'Cloud Payments'
        };

        await smtp.SEND(`${fullName} <${String(email)}>`, 'Cadastro em análise', 'waiting', context);

        res.json({success:true, redirect:true, message: 'You are now registred!' });
    }catch(err){
        console.error(err)
        return res.status(400).json({success:false, error:true, message: "Please contact support"});
    }
    
});

/* Login route */
router.post('/login', async(req, res) => {
    try{
        let {mail, password} = req.body

        const companyReq = await CompanyRequest.findOne({where:{mail}})

        if(companyReq && companyReq.dataValues){
            
            if(!await BCRYPT.COMPARE(password,companyReq.dataValues.password))
                return res.status(500).json({success:false, message:"Invalid username/password"})

            return res.status(500).json({success:false,waiting:true, message:"Account in revision"})
        }


        const base = await Clients.findOne({where:{mail}})
        
        if(!base)
            return res.status(403).json({success:false, message:"Invalid username/password"})

        if(!await BCRYPT.COMPARE(password,base.dataValues.password))
            return res.status(500).json({success:false, message:"Invalid username/password"})

        const { id,status,company,name,company_hash } = base.dataValues

        if(status == "block" || status == 0)
            return res.status(400).json({success:false, message:"Account blocked"})

        let Token = await JWT.SIGN({id,mail,status,company,name,company_hash},JWT_TOKEN)
            return res.status(200).cookie('access_token', JSON.stringify(Token.token), { httpOnly: true, sameSite: 'Lax' }).json({success:true, access_token:Token ,message: "Success connection"});
        
    }catch(err){
        console.error(err)
        return res.status(400).json({success:false, error:true, message: "Please contact support"});
    }

});


/* Login route */
router.post('/check', async(req, res) => {

    try{
        let accessToken = req.cookies['access_token'];
        if(!accessToken) return res.status(404).json({success:false,logout:true, error:true});

        accessToken = accessToken.split('"').join('')

        if(!accessToken)
            return res.status(400).json({success:false,logout:true, message:"Access token not found"})
        
        let _TOKEN = await JWT.VERIFY(accessToken,JWT_TOKEN)
        if(!_TOKEN.status)
            return res.status(400).json({success:false,logout:true, message:"Invalid access token"})
    
        return res.status(200).json({success:true,message:"user logged"})
    
    }catch(err){
        console.error({error:err,message:"fatal"})
        return res.status(400).json({success:false,logout:true, error:true, message: "Please contact support"});
    }
});


/* Statements route */

const startOfMonth = date => new Date(date.getFullYear(), date.getMonth(), 1);
const endOfMonth = date => new Date(date.getFullYear(), date.getMonth() + 1, 0);

router.get('/statements', async (req, res) => {
    try {
        let accessToken = req.cookies['access_token'];
        if(!accessToken) return res.status(404).json({success:false,logout:true, error:true});
    
        accessToken = accessToken.split('"').join('')
    
        if(!accessToken)
            return res.status(400).json({success:false,logout:true, message:"Access token not found"})
        
        let _TOKEN = await JWT.VERIFY(accessToken,JWT_TOKEN)
        if(!_TOKEN.status)
            return res.status(400).json({success:false,logout:true, message:"Invalid access token"})
    
        const company_hash = _TOKEN.data.company_hash;

        const pays = await Payments.findAll({where:{company:company_hash,status:"paid"},order: [['createdAt', 'DESC']]})

        res.status(200).json({ success: true, pays});
    } catch (error) {
        console.error('Erro ao obter a renda:', error);
        res.status(500).json({ success: false, error: true, message: "Internal Server Error" });
    }
});

/* Otp route */
router.get('/otp', async (req, res) => {
    try {
        let accessToken = req.cookies['access_token'];
        if(!accessToken) return res.status(404).json({success:false,logout:true, error:true});
    
        accessToken = accessToken.split('"').join('')
    
        if(!accessToken)
            return res.status(400).json({success:false,logout:true, message:"Access token not found"})
        
        let _TOKEN = await JWT.VERIFY(accessToken,JWT_TOKEN)
        if(!_TOKEN.status)
            return res.status(400).json({success:false,logout:true, message:"Invalid access token"})
    
        const company_hash = _TOKEN.data.company_hash;

        const query = await Clients.findOne({where:{company_hash}})

        let { topt } = query.dataValues

        if(topt && topt.split("|")[2] == "true")
            return res.status(400).json({success:false,message:"You already have a registered key, contact support"})
        

        let secret = speakeasy.generateSecret({ length: 20 });

        if(topt && topt.split("|")[2] == "pending"){
            topt = topt.split("|")
            const decode = {
                content:topt[0],
                iv:topt[1]
            }
            const decodeUrl = {
                content:topt[3],
                iv:topt[4]
            }
            const secure = await CRYPTO.DECRYPT(decode)
            const secureUrl = await CRYPTO.DECRYPT(decodeUrl)
            secret.base32 = secure
            secret.otpauth_url = secureUrl
        }

        const secure_opt = await CRYPTO.ENCRYPT(secret.base32)
        const secure_optUrl = await CRYPTO.ENCRYPT(secret.otpauth_url)

        let imageQRCODE = await API({
            url:`https://api.qrserver.com/v1/create-qr-code/?data=${secret.otpauth_url}&amp;size=200x200`,
            method:"GET",
            encoding: null
        })
        qrcode = `data:image/png;base64,${Buffer.from(imageQRCODE).toString('base64')}`;

        res.status(200).json({ success: true, qrcode});
        await Clients.update({topt:`${secure_opt.content}|${secure_opt.iv}|pending|${secure_optUrl.content}|${secure_optUrl.iv}`},{where:{company_hash}})

    } catch (error) {
        console.error('Erro ao obter a renda:', error);
        res.status(500).json({ success: false, error: true, message: "Internal Server Error" });
    }
});


router.post('/otp/:code', async (req, res) => {
    try {

        const code = req.params.code
        let accessToken = req.cookies['access_token'];
        if(!accessToken) return res.status(404).json({success:false,logout:true, error:true});
    
        accessToken = accessToken.split('"').join('')
    
        if(!accessToken)
            return res.status(400).json({success:false,logout:true, message:"Access token not found"})
        
        let _TOKEN = await JWT.VERIFY(accessToken,JWT_TOKEN)
        if(!_TOKEN.status)
            return res.status(400).json({success:false,logout:true, message:"Invalid access token"})
    
        const company_hash = _TOKEN.data.company_hash;

        const query = await Clients.findOne({where:{company_hash}})

        let { topt } = query.dataValues

        topt = topt.split("|")
        const decode = {
            content:topt[0],
            iv:topt[1]
        }

        if(topt && topt[2] == "true")
            return res.status(400).json({success:false,message:"You already have a registered key, contact support"})
        

        const secure_opt = await CRYPTO.DECRYPT(decode)

        const verified = speakeasy.totp.verify({
            secret: secure_opt,
            encoding: 'base32',
            token: code
        });

        if(!verified)
            return res.status(400).json({success:false,message:"Invalid passcode"})

        res.status(200).json({ success: true, message:"OTP Registred"});

        await Clients.update({topt:`${topt[0]}|${topt[1]}|true`},{where:{company_hash}})

    } catch (error) {
        console.error('Erro ao obter a renda:', error);
        res.status(500).json({ success: false, error: true, message: "Internal Server Error" });
    }
});

/* ADMIN  */


/* Login route */
router.post('/authenticate', async(req, res) => {
    try{
        let {mail, password} = req.body

        const admin = await Administrator.findOne({where:{mail}})
        
        if(!admin)
            return res.status(403).json({success:false, message:"Invalid username/password"})

        if(!await BCRYPT.COMPARE(password,admin.dataValues.password))
            return res.status(500).json({success:false, message:"Invalid username/password"})

        const { id,rank } = admin.dataValues

        let Token = await JWT.SIGN({id,mail,rank},JWT_ADMIN)
            return res.status(200).cookie('access_token', JSON.stringify(Token.token), { httpOnly: true, sameSite: 'Lax' }).json({success:true, access_token:Token ,message: "Success connection"});
        
    }catch(err){
        console.error(err)
        return res.status(400).json({success:false, error:true, message: "Please contact support"});
    }

});


/* Approve client route */

router.post('/approve/:id', async(req, res) => {

    try{
        const requests = await CompanyRequest.findOne({where:{id:req.params.id}})
        
        if(!requests)
            return res.status(400).json({success:false, error:false,mssage:"Company request not found"})

        const { mail, password, document, name, phone, zipcode, city, state, address, company, income} = requests.dataValues

        const client = await Clients.create({mail,password,document,name,phone,zipcode,city,state,address,company,income,company_hash:uuid()})
        await client.save()

        await CompanyRequest.destroy({where:{id:req.params.id}})

        const context = {
            nome: 'Analise de Dados',
            empresa: 'Cloud Payments'
        };

        await smtp.SEND(`${name} <${String(mail)}>`, 'Cadastro aprovado', 'approved', context);

        return res.status(200).json({success:true, error:false,mssage:"Company approved"})
    }catch(err){
        console.error(err)
        return res.status(403).json({success:false, error:true,mssage:"contact support"})
    }
});

/* Reject client route */
router.post('/reject/:id', async(req, res) => {

    try{
        const requests = await CompanyRequest.findOne({where:{id:req.params.id}})
        
        if(!requests)
            return res.status(400).json({success:false, error:false,mssage:"Company request not found"})

        const { mail, password, document, name, phone, zipcode, city, state, address, company, income} = requests.dataValues

        const companyRej = await CompanyRejected.create({mail, password, document, name, phone, zipcode, city, state, address, company, income})
        await companyRej.save()

        await CompanyRequest.destroy({where:{id:req.params.id}})

        const context = {
            nome: 'Analise de Dados',
            empresa: 'Cloud Payments'
        };

        await smtp.SEND(`${name} <${String(mail)}>`, 'Cadastro em rejeitado', 'rejected', context);


        return res.status(200).json({success:true, error:false,mssage:"Company rejected"})
    }catch(err){
        console.error(err)
        return res.status(403).json({success:false, error:true,mssage:"contact support"})
    }
});

module.exports = router