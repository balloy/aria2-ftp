import reducer from '../../app/reducers/localDir';
import * as types from '../../app/constants/ActionTypes';

describe('reducers/localDir', () => {
  const initState = reducer(undefined, {});
  it('should return the initial state', () => {
    expect(initState).toEqual({
      dir: '.',
      errorMsg: null,
      isFetching: false,
      items: []
    });
  });

  it('should handle LOCAL_DIR_LOAD_REQUEST', () => {
    const prevState = { ...initState, dir: 'c:\\test', errorMsg: 'error' };
    expect(reducer(prevState, {
      type: types.LOCAL_DIR_LOAD_REQUEST,
    })).toEqual({
      ...prevState,
      errorMsg: null,
      isFetching: true
    });
  });

  it('should handle LOCAL_DIR_LOAD_FAILURE', () => {
    const prevState = { ...initState, isFetching: true };
    expect(reducer(prevState, {
      type: types.LOCAL_DIR_LOAD_FAILURE,
      errorMsg: 'test'
    })).toEqual({
      ...prevState,
      isFetching: false,
      errorMsg: 'test'
    });
  });

  it('should handle LOCAL_DIR_LOAD_SUCCESS', () => {
    let newState = reducer(initState, {
      type: types.LOCAL_DIR_LOAD_SUCCESS,
      dir: 'C:\\temp',
      items: ['a.txt', 'b.exe']
    });
    expect(newState).toEqual({
      dir: 'C:\\temp',
      errorMsg: null,
      isFetching: false,
      items: ['a.txt', 'b.exe']
    });

    newState = reducer( { ...newState, errorMsg: 'test' }, {
      type: types.LOCAL_DIR_LOAD_SUCCESS,
      dir: 'd:\\work\\test',
      items: []
    });
    expect(newState).toEqual({
      dir: 'd:\\work\\test',
      errorMsg: null,
      isFetching: false,
      items: []
    });
  });
});
