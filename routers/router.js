const express = require('express');
const router = new express.Router();
require('../db/connection');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const {userAuth} = require('../controllers/conrtoller');
const User = require('../models/user');
const Brand = require('../models/brand');
const Orders = require('../models/orders');
const Products =require('../models/products');
const Cart = require('../models/cart');
//get ---------------------------------------------
//homePage
router.get('/',async(req,res)=>{
    try {
        const products = await Products.find({});

        if(req.session.user){
            const cart = await Cart.find({user:req.session.user._id});
            return res.render('user/index',{page:'main',user:req.session.user,products,cart});
        }
        
        res.render('user/index',{page:'main',user:req.session.user,products});
        
    } catch (error) {
        console.log(error)
        res.status(500).send();
    }
});
//login
router.get('/login', (req, res) => {
    try {
        res.render('user/login');
    } catch (error) {
        res.status(500).send();
    }
});
//register
router.get('/register', (req, res) => {
    try {
        res.render('user/register');
    } catch (error) {
        res.status(500).send();
    }
});
//logout
router.get('/logout', (req, res) => {
    try {
        req.session.destroy(err=>{
            if(err){
                return res.redirect('/admin/home');
            }

            res.clearCookie(process.env.SESSION_NAME);
            res.redirect('/');
        });
    } catch (error) {
        res.status(500).send();
    }
});
//add-to-cart
router.get('/add_to_cart/:id',userAuth,async(req,res)=>{
    try {
        const id = req.params.id;
        const userCart = await Cart.findOne({user:req.session.user._id,product:id});
        if(!userCart){
            const addCart = await Cart({
                user:req.session.user._id,
                product:id,
                quantity:1
            });
            await addCart.save();
            return res.redirect('/');
        }else{
            const updateCart = await Cart.findOneAndUpdate({product:id,user:req.session.user._id},{$inc:{quantity:1}});
            res.redirect('/');
        }
    } catch (error) {
        console.log(error)
        res.status(500).send();
    }
});
//shop
router.get('/shop',async(req,res)=>{
    try {
        const q= req.query.q;
        const g=req.query.g;
        const b=req.query.b;
        const brands = await Brand.find({});
        if(q){
            const products = await Products.find({type:q});
            if(req.session.user){
                const cart = await Cart.find({user:req.session.user._id});
                return res.render('user/index',{page:'shop',user:req.session.user,cart,products,brands});
            }
            res.render('user/index',{page:'shop',user:req.session.user,products,brands});
        }else if(g){
            const products = await Products.find({category:g});
            if(req.session.user){
                const cart = await Cart.find({user:req.session.user._id});
                return res.render('user/index',{page:'shop',user:req.session.user,cart,products,brands});
            }
            res.render('user/index',{page:'shop',user:req.session.user,products,brands});
        }else if(b){
            const products = await Products.find({brand:b});
            if(req.session.user){
                const cart = await Cart.find({user:req.session.user._id});
                return res.render('user/index',{page:'shop',user:req.session.user,cart,products,brands});
            }
            res.render('user/index',{page:'shop',user:req.session.user,products,brands});
        }else{
            const products = await Products.find({});
            if(req.session.user){
                const cart = await Cart.find({user:req.session.user._id});
                return res.render('user/index',{page:'shop',user:req.session.user,cart,products,brands});
            } 
            res.render('user/index',{page:'shop',user:req.session.user,products,brands});
        }
        
    } catch (error) {
        console.log(error)
        res.status(500).send();
    }
});
//product detail
router.get('/detail',(req,res)=>{
    try {
        res.render('user/index',{page:'details'})
    } catch (error) {
        console.log(error)
        res.status(500).send();
    }
});


//post--------------------------------
//login
router.post('/login',async(req, res) => {
    try {
        const {user_email,user_password} = req.body;
        let log_errors= [];
        if(!user_email || !user_password){
            log_errors.push({msg:'Please Fill all the fields'});
        }
        const user = await User.findOne({email:user_email});
        if(!user && user_email && user_password){
            log_errors.push({msg:'Email or Password is wrong'});
        }
        if(user){
            const match = await  bcrypt.compare(user_password,user.password);
            if(!match){
                log_errors.push({msg:'Email or password is wrong'});
            }
        }
        if(log_errors.length > 0){
            return res.render('user/login',{log_errors:log_errors});
        }else{
            req.session.user = user;
            res.redirect('/');
        }
    } catch (error) {
        console.log(error)
        res.status(401).send();
    }
});
//register
router.post('/register',async(req,res)=>{
    try {
        const {email,name,phone,password,confirmPassword}= req.body;
        let reg_errors =[];
        if(!email || !password || !phone || !confirmPassword || !name){
            reg_errors.push({msg:'Please fill all the fields'})
        }
        if(confirmPassword !== password && email && phone && name){
            reg_errors.push({msg:'Password does not match'});
        }
        const user = await User.find({email:email});
        if(user.length > 0){
            reg_errors.push({msg:'Email id already exist'});
        }

        if(reg_errors.length > 0){
           return res.render('user/register',{reg_errors:reg_errors});
        }else{
            const regUser = new User({
                email:email,
                password:password,
                name:name,
                phone:phone
            });
            await regUser.save();
            res.redirect('/login');
             
        }
    } catch (error) {
        res.status(500).send();
    }
});

//order
router.get('/buy/:id',userAuth,async(req,res)=>{
    try {
        const id= req.params.id;
        // const order = new Orders({
        //     user:req.session.user._id,
        //     product:id,
        //     payment:'cod'
        // });
        // await order.save();
        const item = await Products.findById({_id:id});
        res.render('user/index',{page:'buy',item});
    } catch (error) {
        console.log(error);
        res.status(500).send();
    }
})

module.exports = router;