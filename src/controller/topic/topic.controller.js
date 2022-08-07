const { bad, good } = require("../../config/response.config")
const { emptyArray } = require("../../library/validation.library")
const { blogModel } = require("../../model/blog.model")
const { topicModel } = require("../../model/topic.model")

async function addTopic(req, res) {
    try {
        const topics = req.body.topics
        if (emptyArray(topics)) return bad(res, 400, true, 'Topic is required as list array!')

        const temp = []
        for (let e of topics) {
            temp.push({ name: e.trim() })
        }

        // savetopics in db
        const data = await topicModel.create(temp)
        good(res, 201, true, data)
    } catch (e) {
        console.log(e)
        bad(res, 500, true, e.message)
    }
}

async function topicList(req, res) {
    try {
        const all = await topicModel.find().select({ _id: 0, name: 1 }).sort({ name: 1 })
        good(res, 200, false, all)
    } catch (e) {
        console.log(e)
        bad(res, 500, true, e.message)
    }
}


async function avalableTopics(req, res) {
    try {
        const all = await blogModel.aggregate([
            {
                "$group": {
                    "_id": "$topic",
                    "count": { "$sum": 1 }
                }
            }
        ]).sort({ count: -1 })
        good(res, 200, false, all)
    } catch (e) {
        console.log(e)
        bad(res, 500, true, e.message)
    }
}






module.exports = { addTopic, topicList, avalableTopics }