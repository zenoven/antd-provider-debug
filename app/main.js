import '@babel/polyfill';
import React from 'react';
import ReactDOM from 'react-dom';
import { LocaleProvider } from 'antd';
import zh_CN from 'antd/lib/locale-provider/zh_CN';
import 'moment/locale/zh-cn';

import APP from './app';

const Wrapper = (
  // <LocaleProvider locale={zh_CN}>
    <APP />
  // </LocaleProvider>
);

const render = () => {
  ReactDOM.render(
    Wrapper,
    document.getElementById('app')
  );
};

render();
