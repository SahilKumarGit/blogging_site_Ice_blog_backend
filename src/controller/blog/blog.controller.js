const { default: mongoose } = require("mongoose")
const { bad, good } = require("../../config/response.config")
const { emptyObject, emptyString, emptyNumber } = require("../../library/validation.library")
const { auth } = require("../../middleware/auth.middleware")
const { blogModel } = require("../../model/blog.model")
const { userModel } = require("../../model/user.model")

async function create(req, res) {
    try {
        // get body
        const data = req.body
        if (emptyObject(data)) return bad(res, 400, true, "post body is required")
        let { title, innerText, innerHtml, topic } = data
        if (emptyString(title)) return bad(res, 400, true, "title is required")
        if (emptyString(innerHtml)) return bad(res, 400, true, "InnerHtml is required")
        if (emptyString(innerText)) return bad(res, 400, true, "InnerText is required")
        if (emptyString(topic)) return bad(res, 400, true, "Topic is required")


        data.innerText = data.innerText.replace(/\n/g, '').substr(0, 300) // replace all \n from str

        //  call dbfor create blog
        const temp = {
            ...data,
            userId: req.userId
        }
        const blog = await blogModel.create(temp)
        return good(res, 201, true, blog, 'Blog created successfully!')

    } catch (e) {
        bad(res, 500, true, e.message)
    }
}




async function update(req, res) {
    try {
        // get body
        const data = req.body
        const userId = req.userId
        if (emptyObject(data)) return bad(res, 400, true, "post body is required")
        let { title, innerText, innerHtml, imgUrl, topic, blogId } = data
        if (emptyString(title)) return bad(res, 400, true, "title is required")
        if (emptyString(innerHtml)) return bad(res, 400, true, "InnerHtml is required")
        if (emptyString(innerText)) return bad(res, 400, true, "InnerText is required")
        if (emptyString(topic)) return bad(res, 400, true, "Topic is required")
        if (emptyString(blogId)) return bad(res, 400, true, "BlogId is required")
        if (!mongoose.isValidObjectId(blogId)) return bad(res, 400, true, "BlogId is invalid")


        innerText = innerText.replace(/\n/g, '').substr(0, 300) // replace all \n from str

        const blogData = await blogModel.findById(blogId.toString());
        if (!blogData) return bad(res, 404, true, "Blog Not Found!")
        if (blogData.isDeleted || !blogData.isPublished) return bad(res, 404, true, "Blog Not Found!")
        if (blogData.userId != userId.toString()) return bad(res, 403, true, "Unauthorized Access!")

        //  call dbfor create blog
        if (!emptyString(title)) blogData.title = title
        if (!emptyString(innerHtml)) blogData.innerHtml = innerHtml
        if (!emptyString(innerText)) blogData.innerText = innerText
        if (!emptyString(topic)) blogData.topic = topic
        if (!emptyString(imgUrl)) blogData.imgUrl = imgUrl

        await blogData.save()

        // console.log(blogData)

        return good(res, 201, true, { blogData }, 'Blog updated successfully!')

    } catch (e) {
        bad(res, 500, true, e.message)
    }
}



async function listAll(req, res) {
    try {
        // get body
        const page = req.query.page || 1
        const search = req.query.search
        const topic = req.query.topic

        if (page < 1) page = 1

        let limit = 30
        let startFrom = (limit * page) - limit
        //  call dbfor create blog
        const query = {
            isDeleted: false, isPublished: true
        }

        // ?Q search?
        if (!emptyString(search)) {
            query.title = { $regex: search, $options: "i" }
        }
        // related topic
        if (!emptyString(topic)) {
            query.topic = topic
        }

        const blog = await blogModel.find(query)
            .select({ title: 1, innerText: 1, createdAt: 1, _id: 1, userId: 1, imgUrl: 1 }).sort({ createdAt: -1 })
            .populate('userId', { 'name': 1, 'profilePic': 1, '_id': 1, 'verified': 1 })
            .skip(startFrom)
            .limit(limit);

        const count = await blogModel.count(query) || 0
        const totalPages = Math.ceil(count / limit)
        const output = { list: blog, page, totalPages }
        return good(res, 200, true, output, 'Blog listed!')

    } catch (e) {
        bad(res, 500, true, e.message)
    }
}





async function viewOne(req, res) {
    try {
        // get body
        const blogId = req.params.blogId
        if (!mongoose.isValidObjectId(blogId)) return bad(res, 404, true, 'Blog Not Found!')

        const AuthData = await auth(req)
        // console.log('auth', AuthData)

        // each blogview
        const blog = await blogModel.findById(blogId.toString())
            .select({ title: 1, innerHtml: 1, createdAt: 1, _id: 1, userId: 1, imgUrl: 1, isPublished: 1, isDeleted: 1 })
            .populate('userId', { 'name': 1, 'profilePic': 1, '_id': 1, 'verified': 1 })

        if (!blog.isPublished || blog.isDeleted) return bad(res, 404, true, 'Blog Not Found!')
        const userIdFromBlog = blog.userId

        const blogList = await blogModel.find({ isDeleted: false, isPublished: true, userId: userIdFromBlog, _id: { $ne: mongoose.Types.ObjectId(blogId) } })
            .select({ title: 1, innerText: 1, createdAt: 1, _id: 1, userId: 1, imgUrl: 1 }).sort({ createdAt: -1 })
            .populate('userId', { 'name': 1, 'profilePic': 1, '_id': 1, 'verified': 1 })
            .limit(5);

        const canEdit_Delete = AuthData.status && AuthData.userId == blog.userId._id ? true : false

        if (AuthData.status) {
            let user = AuthData.user
            // remove current blog id 
            let i = user.history.indexOf(blogId)
            if (i >= 0) user.history.splice(i, 1)
            // console.log(i)

            // add to start blog id 
            user.history.unshift(blogId)

            //delete indexes >10
            if (user.history.length > 10) user.history = user.history.slice(10)
            await user.save();
            // console.log(user)
        }

        const output = {
            list: blogList,
            current: blog,
            canEdit_Delete
        }
        return good(res, 200, true, output, 'Blog listed!')

    } catch (e) {
        bad(res, 500, true, e.message)
    }
}


async function viewMyOne(req, res) {
    try {
        // get body
        const blogId = req.params.blogId
        if (!mongoose.isValidObjectId(blogId)) return bad(res, 404, true, 'Blog Not Found!')

        const userId = req.userId
        console.log(userId)

        // each blogview
        const blog = await blogModel.findById(blogId.toString())
            .select({ title: 1, innerHtml: 1, topic: 1, innerText: 1, createdAt: 1, _id: 1, userId: 1, imgUrl: 1, isPublished: 1, isDeleted: 1 })
            .populate('userId', { 'name': 1, 'profilePic': 1, '_id': 1, 'verified': 1 })

        if (!blog.isPublished || blog.isDeleted) return bad(res, 404, true, 'Blog Not Found!')
        if (blog.userId._id.toString() != userId.toString()) return bad(res, 404, true, 'Blog Not Found.!')


        return good(res, 200, true, blog, 'Blog listed!')

    } catch (e) {
        bad(res, 500, true, e.message)
    }
}



// Populate inside a populate 🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟

const readHistory = async (req, res) => {
    try {
        const userId = req.userId
        const user = await userModel.findById(userId.toString()).select({ history: 1 })
            .populate({
                path: 'history',
                match: { isDeleted: false, isPublished: true },
                select: { "title": 1, "innerText": 1, "createdAt": 1, "_id": 1, "userId": 1, "imgUrl": 1 },
                populate: {
                    path: 'userId',
                    select: { 'name': 1, 'profilePic': 1, '_id': 1, 'verified': 1 }
                }
            })
        if (!user) return bad(res, 400, true, "User not exist!")


        return good(res, 200, true, user.history, 'read history!')

    } catch (e) {
        bad(res, 500, true, e.message)
    }
}




//  book mark add
const addBookMark = async (req, res) => {
    try {
        const blogId = req.body.blogId
        // const userId = req.userId
        const user = req.user
        if (!user) return bad(res, 400, true, "User not exist!")

        // blogExistOrnot
        const blog = await blogModel.findById(blogId.toString())
        if (!blog) return bad(res, 400, true, "Blog not exist!")
        if (blog.isDeleted) return bad(res, 400, true, "Blog not exist!")
        if (!blog.isPublished) return bad(res, 400, true, "Blog not exist!")
        if (user.bookmarsk.includes(blogId)) return bad(res, 400, true, "Already Added!")

        user.bookmarsk.push(blogId);
        await user.save()
        return good(res, 200, true, {}, 'Added!')

    } catch (e) {
        bad(res, 500, true, e.message)
    }
}



//  book mark add
const removeBookMark = async (req, res) => {
    try {
        const blogId = req.body.blogId
        const userId = req.userId

        // blogExistOrnot
        const blog = await userModel.updateOne({ _id: userId, isDeleted: false, isPublished: true }, {
            $pull: {
                bookmarsk: blogId,
            }
        }, {
            new: true
        })

        return good(res, 200, true, { blog }, 'Blog Removed!')

    } catch (e) {
        bad(res, 500, true, e.message)
    }
}



// Populate inside a populate 🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟

const bookMarkList = async (req, res) => {
    try {
        // get body
        const page = req.query.page || 1
        if (page < 1) page = 1
        let limit = 30
        let startFrom = (limit * page) - limit

        const userId = req.userId
        const user = await userModel.findOne({ _id: userId.toString() })
            .select({ bookmarsk: 1 })
            .slice('bookmarsk', startFrom, limit)
            .populate({
                path: 'bookmarsk',
                match: { isDeleted: false, isPublished: true },
                $slice: ["$_id", 0, 2],
                select: { "title": 1, "innerText": 1, "createdAt": 1, "_id": 1, "userId": 1, "imgUrl": 1 },
                populate: {
                    path: 'userId',
                    select: { 'name': 1, 'profilePic': 1, '_id': 1, 'verified': 1 }
                }
            })
        if (!user) return bad(res, 400, true, "User not exist!")

        const bmark = await userModel.findById(userId.toString()).select({ bookmarsk: 1 })
        const count = bmark.bookmarsk.length
        const totalPages = Math.ceil(count / limit)
        const output = { list: user.bookmarsk, page, totalPages }
        return good(res, 200, true, output, 'bookmark listed!')

    } catch (e) {
        bad(res, 500, true, e.message)
    }
}



async function myBlogs(req, res) {
    try {
        const userId = req.userId
        const query = {
            isDeleted: false, isPublished: true, userId: userId
        }
        const blog = await blogModel.find(query)
            .select({ title: 1, innerText: 1, createdAt: 1, _id: 1, userId: 1, imgUrl: 1 }).sort({ createdAt: -1 })
            .populate('userId', { 'name': 1, 'profilePic': 1, '_id': 1, 'verified': 1 });

        return good(res, 200, true, blog, 'Blog listed!')

    } catch (e) {
        bad(res, 500, true, e.message)
    }
}


async function deleteBlog(req, res) {
    try {
        const userId = req.userId
        const blogId = req.params.blogId
        const query = {
            isDeleted: false, isPublished: true, userId: userId, _id: blogId
        }
        const blog = await blogModel.findOne(query)
            .select({ _id: 1, userId: 1, isDeleted: 1 })

        if (!blog) bad(res, 404, true, 'Blog Not Found!')
        blog.isDeleted = true;
        await blog.save()
        return good(res, 200, true, {}, 'Blog Deleted Successfully!')

    } catch (e) {
        bad(res, 500, true, e.message)
    }
}






module.exports = { createBlog: create, updateBlog: update, listBlog: listAll, viewBlog: viewOne, readHistory, addBookMark, bookMarkList, removeBookMark, myBlogs, deleteBlog, viewMyOne }