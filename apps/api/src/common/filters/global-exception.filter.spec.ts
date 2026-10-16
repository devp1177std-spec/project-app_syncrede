import { Test, TestingModule } from '@nestjs/testing';
import { GlobalExceptionFilter } from './global-exception.filter';
import { HttpException, HttpStatus, ArgumentsHost } from '@nestjs/common';

function makeHost(json: jest.Mock): ArgumentsHost {
  return {
    switchToHttp: () => ({
      getResponse: () => ({
        status: (code: number) => ({ json }),
      }),
      getRequest: () => ({ method: 'GET', url: '/test' }),
    }),
  } as unknown as ArgumentsHost;
}

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GlobalExceptionFilter],
    }).compile();
    filter = module.get<GlobalExceptionFilter>(GlobalExceptionFilter);
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  it('should handle HttpException and return proper error shape', () => {
    const json = jest.fn();
    const host = makeHost(json);
    filter.catch(new HttpException('Not found', HttpStatus.NOT_FOUND), host);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: expect.any(String), message: 'Not found' }),
        meta: expect.objectContaining({ timestamp: expect.any(String) }),
      }),
    );
  });

  it('should handle validation errors (array message) and use VALIDATION_ERROR code', () => {
    const json = jest.fn();
    const host = makeHost(json);
    const exception = new HttpException(
      { message: ['field must be a string'], error: 'Bad Request' },
      HttpStatus.BAD_REQUEST,
    );
    filter.catch(exception, host);
    const payload = json.mock.calls[0][0];
    expect(payload.error.code).toBe('VALIDATION_ERROR');
    expect(payload.error.details).toEqual(['field must be a string']);
  });

  it('should handle unknown errors gracefully', () => {
    const json = jest.fn();
    const host = makeHost(json);
    filter.catch(new Error('something broke'), host);
    const payload = json.mock.calls[0][0];
    expect(payload.success).toBe(false);
    expect(payload.error.code).toBe('INTERNAL_SERVER_ERROR');
  });
});
