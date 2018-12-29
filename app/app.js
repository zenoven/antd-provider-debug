import Dva from 'dva';
import createHistory from 'history/createBrowserHistory';
import { hot } from 'react-hot-loader';

import router from './router';

export const history = createHistory();

const app = new Dva({
  history,
});

app.router(router.RouterConfig);

const APP = app.start();

export default hot(module)(APP);