const express = require('express')
const { createBlog, listBlog, viewBlog, readHistory, addBookMark, bookMarkList, removeBookMark, myBlogs, deleteBlog, viewMyOne, updateBlog } = require('../controller/blog/blog.controller')
const { addTopic, topicList, avalableTopics } = require('../controller/topic/topic.controller')
const { upload, uploadProfilePic } = require('../controller/uploading/uploadFiles.controller')
const { register, login, basicUser, profile, followUnfollow, updateProfile } = require('../controller/user/user.controller')
const { authO } = require('../middleware/auth.middleware')
const router = express.Router()

// apis relate to users
router.post('/register', register)
router.post('/login', login)
router.get('/user/basic', authO, basicUser)
router.get('/user/profile/:uid', authO, profile)
router.put('/user/profile/update', authO, updateProfile)
router.post('/user/followUnfollow/:uid', authO, followUnfollow)

// upload here
router.post('/upload', upload)
router.post('/uploadProfile', uploadProfilePic)

// topics
router.post('/topic/add', addTopic)
router.get('/topic/list', topicList)
router.get('/topic/avalable', avalableTopics)

//blog
router.post('/blog/add', authO, createBlog)
router.put('/blog/update', authO, updateBlog)
router.get('/blog/list', listBlog)
router.get('/blog/view/:blogId', viewBlog)
router.get('/blog/readHistory', authO, readHistory)
router.post('/blog/addBookmark', authO, addBookMark)
router.delete('/blog/removeBookmark', authO, removeBookMark)
router.get('/blog/bookmarks', authO, bookMarkList)
router.get('/blog/myBlogs', authO, myBlogs)
router.delete('/blog/delete/:blogId', authO, deleteBlog)
router.get('/blog/my/:blogId', authO, viewMyOne)


module.exports = router