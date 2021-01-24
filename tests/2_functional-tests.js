const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

let board = 'testboard';
let text = 'test text';
let delete_password = 'deletepass';
let thread_id;
let reply_id;

suite('Functional Tests', function () {
  suite('API requests', () => {
    test('Creating a new thread: POST request to /api/threads/{board}', function (done) {
      chai
        .request(server)
        .post(`/api/threads/${board}`)
        .send({
          text,
          delete_password,
        })
        .end(function (err, res) {
          assert.equal(res.body.status, 'success');
          done();
        });
    });

    test('Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}', function (done) {
      chai
        .request(server)
        .get(`/api/threads/${board}`)
        .end(function (err, res) {
          assert.isArray(res.body.doc);
          thread_id = res.body.doc[0]._id;
          done();
        });
    });

    test('Reporting a thread: PUT request to /api/threads/{board}', function (done) {
      chai
        .request(server)
        .put(`/api/threads/${board}`)
        .send({
          thread_id,
        })
        .end(function (err, res) {
          assert.equal(res.text, 'success');
          done();
        });
    });
    test('Creating a new reply: POST request to /api/replies/{board}', function (done) {
      chai
        .request(server)
        .post(`/api/replies/${board}`)
        .send({
          text,
          delete_password,
          thread_id,
        })
        .end(function (err, res) {
          assert.equal(res.body.status, 'success');
          done();
        });
    });

    test('Viewing a single thread with all replies: GET request to /api/replies/{board}', function (done) {
      chai
        .request(server)
        .get(`/api/replies/${board}`)
        .query({
          thread_id,
        })
        .end(function (err, res) {
          assert.equal(res.body.doc[0]._id, thread_id);
          reply_id = res.body.doc[0].replies[0]._id;
          done();
        });
    });

    test('Reporting a reply: PUT request to /api/replies/{board}', function (done) {
      chai
        .request(server)
        .put(`/api/replies/${board}`)
        .send({
          thread_id,
          reply_id,
        })
        .end(function (err, res) {
          assert.equal(res.text, 'success');
          done();
        });
    });

    test('Deleting a reply with the incorrect password: DELETE request to /api/threads/{board} with an invalid delete_password', function (done) {
      chai
        .request(server)
        .delete(`/api/replies/${board}`)
        .send({
          thread_id,
          reply_id,
          delete_password: 'wrong',
        })
        .end(function (err, res) {
          assert.equal(res.text, 'incorrect password');
          done();
        });
    });

    test('Deleting a reply with the correct password: DELETE request to /api/threads/{board} with a valid delete_password', function (done) {
      chai
        .request(server)
        .delete(`/api/replies/${board}`)
        .send({
          thread_id,
          reply_id,
          delete_password,
        })
        .end(function (err, res) {
          assert.equal(res.text, 'success');
          done();
        });
    });

    test('Deleting a thread with the incorrect password: DELETE request to /api/threads/{board} with an invalid delete_password', function (done) {
      chai
        .request(server)
        .delete(`/api/threads/${board}`)
        .send({
          thread_id,
          delete_password: 'wrong',
        })
        .end(function (err, res) {
          assert.equal(res.text, 'incorrect password');
          done();
        });
    });

    test('Deleting a thread with the correct password: DELETE request to /api/threads/{board} with a valid delete_password', function (done) {
      chai
        .request(server)
        .delete(`/api/threads/${board}`)
        .send({
          thread_id,
          delete_password,
        })
        .end(function (err, res) {
          assert.equal(res.text, 'success');
          done();
        });
    });
  });
});
