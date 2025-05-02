
/* Basic CDC consumer using kafkajs + drizzle */
import { Kafka } from 'kafkajs';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

const kafka = new Kafka({ brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'] });
const consumer = kafka.consumer({ groupId: 'pacs-sync-loader' });

const client = new pg.Client({ connectionString: process.env.TF_DB_URL });
const db = drizzle(client);

async function run() {
  await client.connect();
  await consumer.connect();
  await consumer.subscribe({ topic: 'dbserver1.public.property', fromBeginning: false });
  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const payload = JSON.parse(message.value.toString());
      if (payload.op === 'c' || payload.op === 'u') {
        const data = payload.after;
        await db.insert(property).values({
          id: data.id,
          geoId: data.geo_id,
          situsAddr: data.situs_address,
        }).onConflictDoUpdate({ target: property.id, set: { situsAddr: data.situs_address }});
      }
    },
  });
}

run().catch(console.error);
