const uploadNFT = require('../middleware/uploadNFT')
const uploadBanner = require('../middleware/uploadBanner')
const express = require('express')
const mongoose = require('mongoose')
const Grid = require('gridfs-stream')
const pinataSDK = require('@pinata/sdk')
const Tokens = require('./../models/nftsModel')
const Users = require('./../models/usersModel')
const { query } = require('../schemas/nftSchema')
var fs = require('fs')
const router = express.Router()


let nfts

const conn = mongoose.connection
conn.once("open", function(){
    nfts = Grid(conn.db, mongoose.mongo)
    nfts.collection("nft")
})

const pinata = pinataSDK('7a0e01d7b7ea27cdd9f9', 'd02fc23c05b60f766cb3b884149c2274e1c41c4837c1592ba9f26b8a2ce4e8b3');


router.post('/create', async (req, res) => {
    if (req.body.wallet){
        const user = await Users.findOne({"wallet": req.body.wallet})
        const result = await Tokens.create({
            title: req.body.title,
            collect: req.body.collect,
            description: req.body.description,
            royalty: req.body.royalty,
            owner: user._id,
            img: req.body.img,
            pdf: req.body.pdf,
            verified: req.body.verified,
            price: req.body.price,
            location: req.body.location,
            type: req.body.type,
            tokenId: req.body.tokenId,
            orderIndex: req.body.orderIndex,
            currentBid: req.body.currentBid,
            startDate: req.body.startDate,
            endDate: req.body.endDate
        })
        const query = await Users.findOneAndUpdate({_id: user._id}, {$push: {nfts: result._id}})
        return res.status(200).send({result, query})
    } else {
            const resClient = await Tokens.create({
        title: req.body.title,
        collect: req.body.collect,
        description: req.body.description,
        royalty: req.body.royalty,
        owner: req.body.userId,
        img: req.body.img,
        pdf: req.body.pdf,
        verified: req.body.verified,
        price: req.body.price,
        location: req.body.location,
        type: req.body.type,
        tokenId: req.body.tokenId,
        orderIndex: req.body.orderIndex,
        currentBid: req.body.currentBid,
        startDate: req.body.startDate,
        endDate: req.body.endDate
    })
    const queue = await Users.findOneAndUpdate({_id: req.body.userId}, {$push: {nfts: resClient._id}})
        return res.status(200).send({resClient, queue})
    }
    
})
router.post('/views', async(req, res) => {
    const result = await Tokens.findOneAndUpdate({"_id": req.body.product}, {$inc: {views: 1}})
    return res.send(result)
} )

router.get('/', async(req, res) => {
    const result = await Tokens.find().populate('owner')
    res.send(result)
})

router.get('/:tokenId', async(req, res) => {
    const result = await Tokens.findOne({"_id": req.params.tokenId}).populate('owner')
    if (result){
        console.log(result)
        return res.send(result)
    }
})
router.post('/buy', async(req, res) => {
    const result = await Tokens.findOneAndUpdate({"_id": req.body.tokenId}, {owner: req.body.buyerId, location: 'collection'})
    const user = await Users.findOneAndUpdate({"_id": req.body.ownerId}, {$pull: {nfts: req.body.tokenId}})
    const user2 = await Users.findOneAndUpdate({"_id": req.body.buyerId}, {$push: {nfts: req.body.tokenId}})
    return res.send({status: success})
})

router.post('/bid', async(req, res) => {
    const result = await Tokens.findOneAndUpdate({"_id": req.body.id}, {$push: {bids: {userId: req.body.userId, bid: req.body.price, bidIndex: req.body.bidIndex}}, currentBid: bid})
    return res.send(result)
})

router.post("/likes", async (req, res) => {
    let result
    if (req.body.status){
        result = await Tokens.findOneAndUpdate({"_id": req.body.product}, {$inc: {likes: 1}})
    } else {
        result = await Tokens.findOneAndUpdate({"_id": req.body.product}, {$inc: {likes: -1}})
    }
    console.log(result)
    return res.send(result)
})

router.post("/upload", uploadNFT.single("file"), async (req, res) => {
    console.log(req)
    if (req.file === undefined) return res.send('you must select a file')
    const imgUrl = `https://desolate-inlet-76011.herokuapp.com/nft/ipfs/${req.file.filename}`
    try{
        const file = await nfts.files.findOne({filename: req.file.filename})
        const readStream = nfts.createReadStream(file.filename)
        pinata.pinFileToIPFS(readStream).then((result) => {
            return res.send({url: imgUrl, result})
        }).catch((err) => {
            //handle error here
            console.log(err);
        })
    } catch(err){
        res.send(err.message)
    }
})

router.post('/uploadPdf', uploadNFT.single("file"), async(req,res) => {
    if (req.file === undefined) return res.send('you must select a file')
    const pdfUrl = `https://desolate-inlet-76011.herokuapp.com/nft/ipfs/${req.file.filename}`
    try{
        const file = await nfts.files.findOne({filename: req.file.filename})
        const readStream = nfts.createReadStream(file.filename)
        pinata.pinFileToIPFS(readStream).then((result) => {
            return res.send({url: pdfUrl, result})
        }).catch((err) => {
            //handle error here
            console.log(err);
        })
    } catch(err){
        res.send(err.message)
    }
})

router.get("/ipfs/:filename", async (req, res) => {
    try{
        const file = await nfts.files.findOne({filename: req.params.filename})
        const readStream = nfts.createReadStream(file.filename)
        readStream.pipe(res)
    } catch(err){

        res.send(err.message)
    }
})



module.exports = router