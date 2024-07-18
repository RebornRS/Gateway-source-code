const express = require('express')
const router = express.Router()
const dayjs = require("dayjs")
const { uuid } = require('uuidv4');
const archiver = require('archiver')
const fs = require('fs');
const { promises: fsPromises } = require('fs');
const path = require('path');

const JWT = require("@utils/jwt")
const { JWT_TOKEN } = process.env

const Clients = require("@models/Clients")
const ClientsKeys = require("@models/ClientsKeys")

/* Script creation */
router.post('/credentials', async function(req,res){

    const accessToken = req.cookies['access_token'].split('"').join('')
    const { status } = req.body

    try{
        if(!accessToken)
            return res.status(400).json({success:false, listen:true, message:"Access token not found"})
        
        let _TOKEN = await JWT.VERIFY(accessToken,JWT_TOKEN)
        if(!_TOKEN.status)
            return res.status(400).json({success:false, listen:true, message:"Invalid access token"})

        const {mail,id,iat,company,company_hash} = _TOKEN.data

        switch (status) {
            case 'generate':
                let key_base64 = Buffer.from(`${company_hash}:${new Date("DD/MM/YYYY")}:${company}`).toString('base64')
                let updateKey = await ClientsKeys.update({hash:key_base64},{where:{client_id:id}})
                if(!updateKey || updateKey[0] == 0){
                    let createKey = await ClientsKeys.create({hash:key_base64, client_id:id, webhook:"",ips:""})
                    await createKey.save()
                }

                return res.status(200).json({success:true, credential:key_base64 ,message:"Credentials generated with success"})
        
            case 'get':
                let getKey = await ClientsKeys.findOne({where:{client_id:id}})
                if(!getKey){
                    let key_base64 = Buffer.from(`${company_hash}:${new Date("DD/MM/YYYY")}:${company}`).toString('base64')
                    let createKey = await ClientsKeys.create({hash:key_base64, client_id:id, webhook:"",ips:""})
                    await createKey.save()
                    return res.status(200).json({success:true, credential:key_base64 ,message:"Credentials found with success"})
                }

                return res.status(200).json({success:true, credential:getKey.dataValues.hash, message:"Credentials found with success"})
        }
    }catch(err){
        console.error(err)
        return res.status(400).json({success:false, error:true, message: "Please contact support"});
    }
})

module.exports = router;