const TimeoutConstructor: typeof setTimeout = setTimeout.constructor as any;

function createPropertyName(...args: Array<string | number | Array<string | number>>): string {
  const tokens: string[] = [];
  let nargs = args.length;
  if (nargs === 1 && Array.isArray(args[0])) {
    args = args[0];
    nargs = args.length;
  }
  for (let i = 0; i < nargs; i++) {
    const arg = args[i];
    if (typeof arg === 'string') {
      if (tokens.length > 0) {
        tokens.push('.');
      }
      tokens.push(arg);
    } else if (typeof arg === 'number') {
      tokens.push('[' + arg + ']');
    } else {
      throw new Error('Invalid argument type at index ' + i + ' (must be string or number).');
    }
  }
  return tokens.join('');
}

function _isArray(val: any): val is any[] {
  return Array.isArray(val);
}

function _isObject(val: any): val is object {
  return val != null && typeof val === 'object';
}

function _isTimeout(val: any): boolean {
  return val instanceof TimeoutConstructor;  // Change made here
}

export function denormalize(
  data: Record<string, any>,
  keys: Array<string | number> = [],
  map: Record<string, any> = {},
  layer = 0
): Record<string, any> {
  if (_isArray(data)) {
    data.forEach(function (d, i) {
      denormalize(d, keys.concat(i), map);
    });
  } else if (_isTimeout(data)) {
    // if it's a timeout ignore it (it won't denormalize properly)
  } else if (_isObject(data)) {
    const classData = Object.getOwnPropertyDescriptors(Object.getPrototypeOf(data));
    Object.keys(classData).forEach((propertyKey) => {
      if (classData[propertyKey].get !== undefined) {
        map[createPropertyName([...keys, propertyKey])] = data[propertyKey];
      } else if (
        (typeof classData[propertyKey].value === 'function') &&
        layer > 0 &&
        propertyKey !== 'constructor'
      ) {
        map[createPropertyName([...keys, propertyKey])] =
          `function${classData[propertyKey].value.length}`;
      }
    });
    Object.keys(data).forEach(function (key) {
      denormalize(data[key], keys.concat(key), map, layer + 1);
    });
  } else {
    map[createPropertyName(keys)] = data;
  }
  return map;
}
