import express, { ErrorRequestHandler } from 'express';
import apiRouter from './api/router';
import heartbeat from './database/dal/heartbeat';
const app = express();

app.use(express.json());

// Health Check Endpoint
app.get('/health-check', async (req, res) => {
  try {
    await heartbeat();
    return res.status(200).json({
      server_status: 'ACTIVE',
      connection_status: 'ACTIVE',
    });
  } catch (err) {
    return res.status(200).json({
      server_status: 'ACTIVE',
      connection_status: 'INACTIVE',
    });
  }
});

app.get('/force-error', (req, res, next) => {
  const err = new Error('Something went sideways!');
  next(err);
});

app.use('/api', apiRouter);

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: 'Not Found',
  });
});

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error(`[Error] ${err.stack || err.message}`);

  return res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: err.stack,
  });
};

app.use(errorHandler);

export default app;
