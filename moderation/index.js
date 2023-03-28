const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const handleEvents = async (type, data) => {
  if (type === 'CommentCreated') {
    const status = data.content.includes('orange') ? 'rejected' : 'approved';

    await axios.post('http://event-bus-srv:4005/events', {
      type: 'CommentModerated',
      data: {
        id: data.id,
        content: data.content,
        postId: data.postId,
        status
      }
    });
  };
}

app.post('/events', (req, res) => {
  const { type, data } = req.body;

  handleEvents(type, data);

  res.send({});
});

app.listen(4003, async () => {
  console.log('listening on 4003');

  try {
    const res = await axios.get('http://event-bus-srv:4005/events');

    for (let event of res.data) {
      console.log('Processing Event:', event.type);

      handleEvents(event.type, event.data);
    };
  } catch(e) {
    console.log(e.message);
  }
});