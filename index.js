const Block = require('./block')
const Blockchain = require('./blockchain')
const BlockchainNode = require('./blockchainNode')
const Transaction = require('./transaction')

const fetch = require('node-fetch')
const express = require('express')
const app = express()

app.use(express.json())

const [CMD, FILE, PORT = 8080] = process.argv

let transactions = []
let nodes = []
let allTransactions = []

let genesisBlock = new Block()
let blockchain = new Blockchain(genesisBlock)

app.get('/resolve', (req, res) => {

    nodes.forEach(node => {
        fetch(`${node.url}/blockchain`)
        .then(response => response.json())
        .then(otherBlockchain => {
            if(blockchain.blocks.length < otherBlockchain.blocks.length) {
                allTransactions.forEach(transaction => {
                    fetch(`${node.url}/transactions`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(transaction)
                    }).then(response => response.json())
                    .then(_ => {
                        fetch(`${node.url}/mine`)
                        .then(response => response.json())
                        .then(_ => {
                            fetch(`${node.url}/blockchain`)
                            .then(response => response.json())
                            .then(updatedBlockchain => {
                                blockchain = updatedBlockchain
                                res.json(blockchain)
                            })
                        })
                    })
                })
            } else {
                res.json(blockchain)
            }
        })
    })
})

app.post('/nodes/register', (req, res) => {
    const urls = req.body

    urls.forEach(url => {
        const node = new BlockchainNode(url)
        nodes.push(node)
    })

    res.json(nodes)
})

app.post('/transactions', (req, res) => {
    const { to, from, amount } = req.body

    let transaction = new Transaction(from, to, amount)
    transactions.push(transaction)
    res.json(transactions)
})

app.get('/mine', (req, res) => {
    let block = blockchain.getNextBlock(transactions)
    blockchain.addBlock(block)
    transactions.forEach(transaction => {
        allTransactions.push(transaction)
    })
    transactions = []
    res.json(block)
})

app.get('/blockchain', (req, res) => {
    // let transaction = new Transaction("Mary", "Jonah", 100)

    // let genesisBlock = new Block()
    // let blockchain = new Blockchain(genesisBlock)
    
    // let block = blockchain.getNextBlock([transaction])
    // blockchain.addBlock(block)
    
    // let anotherTransaction = new Transaction("Sarah", "Noah", 500)
    // let block1 = blockchain.getNextBlock([anotherTransaction, transaction])
    // blockchain.addBlock(block1)

    res.json(blockchain)
})

app.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}`)
})