const express = require('express')
const Post = require('../models/post')
const User = require('../models/user')
const auth = require('../middleware/auth')

const router = new express.Router()

// Incomplete
router.post('/users', async (req, res) => {
    const user = new User(req.body)

    try {
        await user.save()
        const token = await user.generateAuthToken()
        res.status(201).send({ user, token })
    } catch (e) {
        // temporary fix, need to customise the error msg later
        res.status(400).send({error: e.message})
    }
})


router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({ user, token })
    } catch (e) {
        res.status(400).send({error: e.message})
    }
})


router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })

        await req.user.save()

        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()

        res.send()
    } catch (e) {
        res.status(500).send()
    }
})


router.get('/users/me', auth, async (req, res) => {
    // populate the user to allow the toJSON() function to read user.posts
    await req.user.populate('posts')
    return res.send(req.user)
})


// incomplete
router.get('/users/:username', async (req, res) => {
    if (!req.params.username) {
        return res.status(400).send({ error: "Username cannot be empty"})
    }

    const user = await User.findOne({ username: req.params.username })

    if (!user) {
        return res.status(404).send()
    }

    await user.populate('posts')
    return user    
})


router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowUpdates = Object.keys(User.schema.obj)
    const isValidOperation = updates.every(update => allowUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({ error: "Invaid updates." })
    }

    try {
        const user = req.user
        updates.forEach((update => {
            user[update] = req.body[update]
        }))

        await user.save()

        await user.populate('posts')
        return user
    } catch (e) {
        res.status(500).send(e)
    }
})

router.delete('/user/me', auth, async (req, res) => {
    try {
        await req.user.remove()
        res.send()
    } catch (e) {
        res.send(500).send(e)
    }
})

module.exports = router
