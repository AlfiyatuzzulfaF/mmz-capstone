import fs from 'node:fs';
import path from 'node:path';
import mysql from 'mysql2/promise';

/**
 * MMZ Studio Foto - TiDB Cloud Schema Migration & Seeder Script
 * References: docs/prd.md (Sections 3.2 & 5) and docs/ARCHITECTURE.md (Sections 3.1 - 3.3)
 */
async function runSeed() {
  console.log('--- MMZ TiDB Cloud Schema & Seeding Initializer ---');
  console.log('Host:', process.env.DB_HOST || 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com');
  console.log('Port:', process.env.DB_PORT || 4000);
  console.log('Database:', process.env.DB_NAME || 'test');
  console.log('SSL:', process.env.DB_SSL !== 'false' ? 'TLSv1.2 Enforced' : 'Disabled');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
    port: Number(process.env.DB_PORT) || 4000,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'test',
    ssl: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true,
    },
    multipleStatements: true,
  });

  try {
    console.log('Connected to TiDB Cloud successfully.');
    const sqlFilePath = path.join(process.cwd(), 'src', 'lib', 'schema.sql');
    const rawSql = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('Executing schema.sql DDL and seed queries...');
    await connection.query(rawSql);

    console.log('Schema DDL and master seed executed successfully!');

    // Verification queries
    console.log('\n--- Verifying Database State ---');
    const [tables] = await connection.query('SHOW TABLES');
    console.log('Created Tables:', tables.map((t) => Object.values(t)[0]));

    const [[customersCount]] = await connection.query('SELECT COUNT(*) AS total FROM customers');
    const [[studiosCount]] = await connection.query('SELECT COUNT(*) AS total FROM lokasi');
    const [[packagesCount]] = await connection.query('SELECT COUNT(*) AS total FROM paket_layanan');
    const [[adminCount]] = await connection.query('SELECT COUNT(*) AS total FROM admin');
    const [[bookingsCount]] = await connection.query('SELECT COUNT(*) AS total FROM bookings');

    console.log(`- Customers: ${customersCount.total} rows`);
    console.log(`- Studios (Lokasi): ${studiosCount.total} rows`);
    console.log(`- Service Packages: ${packagesCount.total} rows`);
    console.log(`- Admin: ${adminCount.total} rows`);
    console.log(`- Sample Bookings: ${bookingsCount.total} rows`);

    console.log('\nAll tables and seed records verified successfully.');
  } catch (error) {
    console.error('Migration & Seed failed:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

runSeed();
