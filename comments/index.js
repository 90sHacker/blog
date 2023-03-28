const express = require('express');
const bodyParser = require('body-parser');
const { randomBytes } = require('crypto');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());
app.use(cors());

commentsById = {};

app.get('/posts/:id/comments', (req, res) => {
  res.status(201).send(commentsById[req.params.id] || []);
});

app.post('/posts/:id/comments', async (req, res) => {
  const commentId = randomBytes(4).toString('hex');
  const { content } = req.body;

  const comments = commentsById[req.params.id] || []

  comments.push({id: commentId, content, status: 'pending'});

  commentsById[req.params.id] = comments;

  await axios.post('http://event-bus-srv:4005/events', {
    type: 'CommentCreated',
    data: {
      id: commentId,
      content,
      postId: req.params.id,
      status: 'pending'
    }
  });

  res.status(201).send(comments);
});

app.post('/events', async (req, res) => {
  console.log('Received Event', req.body.type);

  const { type, data } = req.body;

  if (type === 'CommentModerated') {
    const { id, postId, status } = data;

    const comment = commentsById[postId].find(comment => {
      return comment.id === id;
    });

    comment.status = status;

    await axios.post('http://event-bus-srv:4005/events', {
      type: 'CommentUpdated',
      data: {
        id,
        content: data.content,
        status,
        postId
      }
    })
  };

  res.status(200).send({});
});

app.listen(4001, () => {
  console.log('listening on port 4001')
})