import React from 'react';
import { Router, Route, Switch } from 'dva/router';
import { hot } from 'react-hot-loader';


const routes = [
  { path: '/', exact: true, component: () => 'hello world!' },
];

function RouterConfig({ history }) {
  return (
    <Router history={history}>
      <Switch>
        {
          routes.map((route, index) => (
            <Route
              {...route}
              key={route.path}
            />
          ))
        }
      </Switch>
    </Router>
  );
}

export default hot(module)({ routes, RouterConfig });
