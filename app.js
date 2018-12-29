const koa = require('koa');
const cache = require('koa-static-cache');
const page = require('./utils/page');
const PORT = 3000;

const app = new koa();
app.keys = ['can you guess the key? 23413424FASDFWERWQGGAA'];
app.proxy = true;

app.use(cache(__dirname + '/app', {
  prefix: '/assets',
  buffer: true,
  gzip: true
}));

app.use(page.routes());
app.use(page.allowedMethods());

app.listen(PORT, () => {
    console.log('server started at:', PORT);
});
