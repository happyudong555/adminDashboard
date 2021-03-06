// import
const express = require('express');
const next = require('next');
const dev = process.env.NODE_ENV !== 'production';
const PORT = process.env.PORT || 80;
// using in development
//const app = next({ dev });
// using in production
const app = next({ dir: '.', dev: false, staticMarkup: false, quiet: false, conf: null, chunk: null, cache: true });
const handle = app.getRequestHandler();
const cors = require('cors');
const bodyParser = require('body-parser');
const compression = require('compression');
const mongoose = require('mongoose');
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
// using in production
//const connectServer = 'mongodb://mongo:27017/penedgeDB1234';
// using in testing code
const connectServer = 'mongodb://localhost:27017/penedgeDB1234';
mongoose.connect(connectServer, { useNewUrlParser: true });
const multer = require('multer');
const aws = require('aws-sdk');
const multerS3 = require('multer-s3');
const jwt = require('jsonwebtoken');
// API
app.prepare().then(() => {
    const server = express();
    // compression file
    server.use(compression());
    // setpermission
    server.use(cors({ origin: true }));
    server.use(bodyParser.json({ limit: '50mb' }));
    server.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
    //Enabling CORS
    server.use((req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Methods", "PUT, POST, GET, OPTIONS, DELETE");
        next();
    });
    const storageId = '6YIMOE2NFUHFLM6NXDNT';
    const storageKey = 'pjpz0SX3q5q25o68fxE+z5lIi6gX+/jnTeczD2g5GNU';
    const profileImageAPI = new aws.Endpoint('sgp1.digitaloceanspaces.com/profile_image/');
    const contentAPI = new aws.Endpoint('sgp1.digitaloceanspaces.com/content/');
    const adminProfile = new aws.S3({
        endpoint: profileImageAPI,
        accessKeyId: storageId,
        secretAccessKey: storageKey
    });
    const adminContent = new aws.S3({
        endpoint: contentAPI,
        accessKeyId: storageId,
        secretAccessKey: storageKey
    });
    // determine upload folder
    const uploadProfile = multer({
        storage: multerS3({
            s3: adminProfile,
            bucket: 'penedge',
            acl: 'public-read-write',
            metadata: function (req, file, cb) {
                cb(null, { fieldName: file.originalname });
            },
            key: function (req, file, cb) {
                cb(null, file.originalname)
            }
        })
    });
    const uploadPost = multer({
        storage: multerS3({
            s3: adminContent,
            bucket: 'penedge',
            acl: 'public-read-write',
            metadata: function (req, file, cb) {
                cb(null, { fieldName: file.originalname });
            },
            key: function (req, file, cb) {
                cb(null, file.originalname)
            }
        })
    });
    // Schema
    const User = require('./static/schema/user.model');
    const Blog = require('./static/schema/blog.model');

    // Authentication API
    server.post('/register', uploadProfile.single("profileImage"), (req, res) => {
        const newUser = new User();
        newUser.email = req.body.email;
        newUser.username = req.body.username;
        newUser.password = jwt.sign(req.body.password, req.body.username);
        newUser.image = req.file.key;
        newUser.save((err, newUser) => {
            if (!err) {
                res.redirect('/')
            }
            else {
                res.send(newUser)
            }
        });
    });
    server.get('/activeUser', (req, res) => {
        mongoose.model('User').find().exec((err, user) => {
            if (err) {
                res.status(404).send('404 NOT FOUND!')
            }
            else {
                res.send(user)
            }
        });
    });
    // find info by username
    server.get('/register/:username', (req, res) => {
        const username = req.params.username;
        User.findOne({ username }, (err, user) => {
            res.send(user);
        });
    });
    server.post('/login', (req, res) => {
        if (!req.body.username || !req.body.password) {
            res.redirect('/')
        }
        else {
            res.send(user);
        }
    });
    // logout from system
    server.get('/logout', function (req, res) {
        req.logout();
    });
    // Blog API
    server.post('/blog', uploadPost.fields([{ name: 'cover' }, { name: 'multiFile' }]), (req, res) => {
        const blog = new Blog();
        blog.image = req.body.image;
        blog.title = req.body.title;
        blog.content = req.body.content;
        blog.author = req.body.author;
        blog.category = req.body.category;
        blog.albums = req.body.albums;
        blog.date = req.body.date;
        blog.selectted_banks = req.body.selectted_banks;
        blog.bankAccount_name = req.body.bankAccount_name;
        blog.bankAccount = req.body.bankAccount;
        blog.price = req.body.price;
        blog.save((err, newBlog) => {
            if (err) {
                res.redirect('/dashboard')
            }
            else {
                res.send(newBlog)
            }
        });
    });
    //update Blog Data
    server.put('/ChangeCoverBlog/:id', uploadPost.fields([{ name: 'cover' }]), (req, res) => {
        const id = req.params.id;
        Blog.findByIdAndUpdate({ _id: id }, {
            $set: {
                image: req.body.image
            }
        }, (err, admin) => {
            res.send(admin);
        });
    });
    server.put('/ChangeTitleBlog/:id', (req, res) => {
        const id = req.params.id;
        Blog.findByIdAndUpdate({ _id: id }, {
            $set: {
                title: req.body.title
            }
        }, (err, admin) => {
            res.send(admin);
        });
    });
    server.put('/ChangeContentBlog/:id', (req, res) => {
        const id = req.params.id;
        Blog.findByIdAndUpdate({ _id: id }, {
            $set: {
                content: req.body.content
            }
        }, (err, admin) => {
            res.send(admin);
        });
    });
    server.put('/ChangeCategoryBlog/:id', (req, res) => {
        const id = req.params.id;
        Blog.findByIdAndUpdate({ _id: id }, {
            $set: {
                category: req.body.category
            }
        }, (err, admin) => {
            res.send(admin);
        });
    });
    server.put('/ChangeServiceBlog/:id', (req, res) => {
        const id = req.params.id;
        Blog.findByIdAndUpdate({ _id: id }, {
            $set: {
                service: req.body.service
            }
        }, (err, admin) => {
            res.send(admin);
        });
    });
    server.put('/ChangeAlbumsBlog/:id', uploadPost.fields([{ name: 'multiFile' }]), (req, res) => {
        const id = req.params.id;
        Blog.findByIdAndUpdate({ _id: id }, {
            $addToSet: {
                multiFile: req.files.originalname,
                albums: req.body.albums
            }
        }, (err, admin) => {
            res.send(admin);
        });
    });
    server.put('/ChangebankAccount_name/:id', (req, res) => {
        const id = req.params.id;
        Blog.findByIdAndUpdate({ _id: id }, {
            $set: {
                bankAccount_name: req.body.bankAccount_name
            }
        }, (err, admin) => {
            res.send(admin);
        });
    });
    server.put('/ChangeBankAccount/:id', (req, res) => {
        const id = req.params.id;
        Blog.findByIdAndUpdate({ _id: id }, {
            $set: {
                bankAccount: req.body.bankAccount
            }
        }, (err, admin) => {
            res.send(admin);
        });
    });
    server.put('/ChangePrice/:id', (req, res) => {
        const id = req.params.id;
        Blog.findByIdAndUpdate({ _id: id }, {
            $set: {
                price: req.body.price
            }
        }, (err, admin) => {
            res.send(admin);
        });
    });
    server.put('/ChangeBank/:id', (req, res) => {
        const id = req.params.id;
        Blog.findByIdAndUpdate({ _id: id }, {
            $set: {
                selectted_banks: req.body.selectted_banks
            }
        }, (err, admin) => {
            res.send(admin);
        });
    });
    //update user infomation
    server.put('/changeProfileImage/:id', uploadProfile.fields([{ name: 'profileImage' }]), (req, res) => {
        const id = req.params.id;
        User.findByIdAndUpdate({ _id: id }, {
            $set: {
                profileImage: req.files.key,
                image: req.body.image
            }
        }, (err, updateInfo) => {
            if (err) {
                res.redirect('/dashboard');
            }
            else {
                res.send(updateInfo)
            }
        });
    });
    server.put('/changePassword/:id', (req, res) => {
        const id = req.params.id;
        User.findOneAndUpdate({ _id: id }, {
            $set: {
                password: jwt.sign(req.body.password, req.body.username)
            }
        }, (err, updateInfo) => {
            if (err) {
                res.redirect('/dashboard');
            }
            else {
                res.send(updateInfo)
            }
        });
    })

    //query by id
    server.get('/blog/:author', (req, res) => {
        const author = req.params.author;
        Blog.find({ author }, (err, admin) => {
            if (err) {
                res.redirect('/dashboard');
            }
            else {
                res.send(admin)
            }
        }).sort({ title: -req.body.title });
    });
    // query public
    server.get('/blog', (req, res) => {
        mongoose.model('Blog').find().sort({ title: -req.body.title }).exec((err, content) => {
            if (err) {
                res.status(404).send('404 NOT FOUND!')
            }
            else {
                res.send(content);
            }
        });
    });
    // delete blog
    server.delete('/blog/:id', (req, res) => {
        const id = req.params.id;
        Blog.findByIdAndDelete({ _id: id }, (err, admin) => {
            res.send(admin);
        });
    })
    // delete albums
    server.delete('/deleteAlbums/:albums', (req, res) => {
        const albums = req.params.albums;
        Blog.updateOne({ $pull : { albums } }, (err, admin) => {
            res.send(admin);
        });
    })
    // clean URL
    server.get('/detail/:id', (req, res) => {
        const id = req.params.id;
        Blog.find({ _id: id }, (err, admin) => {
            res.send(admin);
        }).limit(1);
    })
    // running server
    server.get('*', (req, res) => {
        return handle(req, res)
    });
    server.listen(PORT, err => {
        if (err) {
            throw err
        }
        else {
            console.log(`> Ready on http://localhost:${PORT}`)
        }
    })
});