import Fastify from 'fastify'
import { z } from 'zod'
import cors from '@fastify/cors'
import  ShortUniqueId  from 'short-unique-id'
import  jwt  from '@fastify/jwt'

import { poolRoutes } from './routes/pool'
import { authRoutes } from './routes/auth'
import { gameRoutes } from './routes/game'
import { guessRoutes } from './routes/guess'
import { userRoutes } from './routes/user'


// singleton ->

async function bootstrap(){
   const fastify = Fastify({
   logger: true,
   })

   await fastify.register(cors, {
      origin: true,
   })

await fastify.register(jwt, {
   secret: 'nwlcopa',
})
//a frase secreta deve ser definida numa variável de ambiente

await fastify.register(authRoutes)
await fastify.register(gameRoutes)
await fastify.register(guessRoutes)
await fastify.register(userRoutes)
await fastify.register(poolRoutes)

   await fastify.listen({ port: 3333});
}


bootstrap()