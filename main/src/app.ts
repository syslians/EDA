import * as express from 'express'
import {Request, Response} from 'express'
import * as cors from 'cors'
import {createConnection} from "typeorm";
import * as amqp from 'amqplib/callback_api';
import axios from 'axios';
import { connect } from 'http2';
import { error } from 'console';
import { Product } from './entity/product';

createConnection()
    .then(db => { 
        const app = express();
        const productRepository = db.getMongoRepository(Product)

        amqp.connect('amqps://hvqmbjdq:OaEWP5JYid10szxBBIVIXGwG5JHn8Y22@gerbil.rmq.cloudamqp.com/hvqmbjdq', (error0, connection) => {
            if (error0) {
                throw error0
            }
            connection.createChannel((error1, channel) => {
                if (error1) {
                    throw error1
                }

                channel.assertQueue('product_created', {durable: false});
                channel.assertQueue('product_updated', {durable: false});
                channel.assertQueue('product_deleted', {durable: false});

                app.use(cors({
                    origin: ['http://localhost:3000', 'http://localhost:8080', 'http://localhost:4200']
                }))
        
                app.use(express.json());

                channel.consume('product_created', async (msg) => {
                    const eventProduct: Product = JSON.parse(msg.content.toString())
                    const product = new Product()
                    product.admin_id = parseInt(eventProduct.id)
                    product.title = eventProduct.title
                    product.image = eventProduct.image
                    product.likes = eventProduct.likes
                    await productRepository.save(product)
                    console.log(eventProduct, 'product created')
                }, {noAck: true})

                channel.consume('product_updated', async (msg) => {
                    const eventProduct: Product = JSON.parse(msg.content.toString())
                    const product = await productRepository.findOne({admin_id: parseInt(eventProduct.id)})
                    productRepository.merge(product, {
                        title: eventProduct.title,
                        image: eventProduct.image,
                        likes: eventProduct.likes
                    })
                    await productRepository.save(product)
                    console.log('product updated')
                }, {noAck: true})

                channel.consume('product_deleted', async (msg) => {
                    const admin_id = parseInt(msg.content.toString())
                    await productRepository.deleteOne({admin_id})
                    console.log('product deleted')
                })

                app.get('/api/products', async (req:Request, res:Response) => {
                    const products = await productRepository.find()
                    return res.send(products)
                })

                app.post('/api/products/:id/like', async (req:Request, res:Response) => {
                    const product = await productRepository.findOne(req.params.id)
                    await axios.post(`http://localhost:8000/api/products/${product.admin_id}/like`, {})
                    product.likes++
                    await productRepository.save(product)
                    return res.send(product)
                });
        
                console.log('Listening Port 8001...')
        
                app.listen(8001)
                process.on('beforeExit', () => {
                    console.log('closing')
                    connection.close()
                })
            })
        })
})
