/* eslint-disable no-console */
type LogObject = Record<string, unknown>;

function format(obj: LogObject | undefined, msg: string): string {
  if (obj && Object.keys(obj).length > 0) {
    return `${msg} ${JSON.stringify(obj)}`;
  }
  return msg;
}

const logger = {
  info: (objOrMsg: LogObject | string, msg?: string) => {
    if (typeof objOrMsg === 'string') {
      console.log(objOrMsg);
    } else {
      console.log(format(objOrMsg, msg ?? ''));
    }
  },
  warn: (objOrMsg: LogObject | string, msg?: string) => {
    if (typeof objOrMsg === 'string') {
      console.warn(objOrMsg);
    } else {
      console.warn(format(objOrMsg, msg ?? ''));
    }
  },
  error: (objOrMsg: LogObject | string, msg?: string) => {
    if (typeof objOrMsg === 'string') {
      console.error(objOrMsg);
    } else {
      console.error(format(objOrMsg, msg ?? ''));
    }
  },
  debug: (objOrMsg: LogObject | string, msg?: string) => {
    if (typeof objOrMsg === 'string') {
      console.debug(objOrMsg);
    } else {
      console.debug(format(objOrMsg, msg ?? ''));
    }
  },
};

export default logger;
