import sql from 'mssql';

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_HOST,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 1433,
  options: {
    encrypt: true,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: {
    max: 5,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

const pool = new sql.ConnectionPool(config);
const poolConnect = pool.connect().catch((err) => {
  console.error('MSSQL pool connect error:', err);
  throw err;
});

export async function queryDatabase(query, inputs = []) {
  await poolConnect;
  try {
    const request = pool.request();
    // inputs: [{ name, type, value }]
    for (const inp of inputs) {
      if (inp && inp.name) {
        if (inp.type) request.input(inp.name, inp.type, inp.value);
        else request.input(inp.name, sql.NVarChar(4000), inp.value);
      }
    }
    const result = await request.query(query);
    return result.recordset;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}