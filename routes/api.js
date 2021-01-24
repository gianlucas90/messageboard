'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;
require('dotenv').config();

module.exports = function (app) {
  mongoose.connect(process.env.DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const db = mongoose.connection;
  db.on('error', console.error.bind(console, 'connection error:'));

  db.once('open', function () {
    console.log('we are conncected to the db!');
  });

  // To delete all documents in the database everytime restart the server!
  // db.dropDatabase();

  /////////////////// Schemas
  const threadSchema = new Schema({
    board: { type: String, required: true },
    text: { type: String, required: true },
    created_on: {
      type: Date,
      default: Date.now,
    },
    bumped_on: {
      type: Date,
      default: Date.now,
    },
    reported: { type: Boolean, default: false },
    delete_password: String,
    replies: [
      {
        text: String,
        created_on: {
          type: Date,
          default: Date.now,
        },
        deleted: { type: Boolean, default: false },
        delete_password: String,
        reported: { type: Boolean, default: false },
      },
    ],
  });

  /////////////////// Models
  const Thread = mongoose.model('Stock', threadSchema);

  /////////////////// Routes
  app
    .route('/api/threads/:board')
    .post(async function (req, res) {
      const board = req.params.board;
      const { text, delete_password } = req.body;

      const doc = await Thread.create({ board, text, delete_password });

      res.status(201).json({
        // 201 created
        status: 'success',
        data: {
          data: doc,
        },
      });
    })
    .get(async function (req, res) {
      const board = req.params.board;

      const doc = await Thread.find({ board })
        .limit(10)
        .sort('-bumped_on')
        .select('-replies.delete_password -replies.reported')
        .where('replies')
        .slice(3);

      return res.json({ doc });
    })
    .delete(async function (req, res, next) {
      const { thread_id, delete_password } = req.body;

      const del = await Thread.deleteOne({
        _id: thread_id,
        delete_password,
      });

      if (del.deletedCount === 1) {
        return res.send('success');
      } else {
        return res.send('incorrect password');
      }
    })

    .put(async function (req, res, next) {
      const { thread_id } = req.body;

      const filter = {
        _id: thread_id,
      };

      const updatedObject = {
        $set: { reported: true },
      };

      await Thread.updateOne(filter, updatedObject, (err, updatedObject) => {
        if (!err && updatedObject) {
          return res.send('success');
        }
      });
    });

  app
    .route('/api/replies/:board')
    .get(async function (req, res) {
      const thread_id = req.query.thread_id;

      const doc = await Thread.find({ _id: thread_id }).select(
        '-replies.delete_password -replies.reported'
      );
      return res.json({ doc });
    })
    .post(async function (req, res) {
      const { text, delete_password, thread_id } = req.body;

      const doc = await Thread.findByIdAndUpdate(
        { _id: thread_id },
        {
          $push: { replies: { text, delete_password } },
          $set: { bumped_on: Date.now() },
        }
      );

      res.status(201).json({
        // 201 created
        status: 'success',
        data: {
          data: doc,
        },
      });
    })
    .delete(async function (req, res, next) {
      const { thread_id, reply_id, delete_password } = req.body;

      const filter = {
        _id: thread_id,
        'replies._id': reply_id,
        'replies.delete_password': delete_password,
      };
      const update = {
        $set: { 'replies.$.deleted': true },
      };

      const updated = await Thread.updateOne(filter, update);
      if (updated.n === 1) {
        return res.send('success');
      } else {
        return res.send('incorrect password');
      }
    })
    .put(async function (req, res, next) {
      const { thread_id, reply_id } = req.body;

      const filter = {
        _id: thread_id,
        'replies._id': reply_id,
      };

      const updatedObject = {
        $set: { 'replies.$.reported': true },
      };

      await Thread.updateOne(filter, updatedObject, (err, updatedObject) => {
        if (!err && updatedObject) {
          return res.send('success');
        }
      });
    });
};
