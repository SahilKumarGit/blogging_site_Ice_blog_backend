function good(res, code, login, data = {}, message = "All Ok For Now!") {
    return res.status(code).send({ status: true, login, data, message })
}

function bad(res, code, login, message = "All Ok For Now!") {
    return res.status(code).send({ status: false, login, message })
}

module.exports = { good, bad }