console.log('mongoTest route loaded');
const express = require('express');
const router = express.Router();
const Test = require('../models/Test');

// POST /mongo-test - create a test document
router.post('/', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message field is required' });
    }
    const doc = await Test.create({ message });
    res.status(201).json(doc);
  } catch (err) {
    console.error('Error creating test document:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /mongo-test - retrieve all test documents
router.get('/', async (req, res) => {
  try {
    const docs = await Test.find();
    res.json(docs);
  } catch (err) {
    console.error('Error fetching test documents:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
