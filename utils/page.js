const Router = require('koa-router');
const path = require('path');
const views = require('koa-views');

const prefix = '/';

const page = module.exports = new Router();

const viewRoot = path.join(__dirname, '../app/_views');

page.use(views(viewRoot, {
  extension: 'ejs'
}));

page.get(prefix + '*', async (ctx) => {
  await ctx.render('app', {});
});
