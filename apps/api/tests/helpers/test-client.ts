/**
 * India Trikotaj — Resilient API Test Client
 * Supports both in-process Express execution (sandbox safe, zero TCP socket required)
 * and live HTTP execution via fetch when process.env.TEST_API_URL is supplied.
 */

import http from 'node:http';
import net from 'node:net';

export interface TestResponse {
  status: number;
  headers: Record<string, string>;
  body: any;
}

export class ApiTestClient {
  private app: any;
  private baseUrl: string;

  constructor(app?: any, baseUrl?: string) {
    this.app = app;
    this.baseUrl = baseUrl || process.env.TEST_API_URL || '';
  }

  public async get(path: string, headers: Record<string, string> = {}): Promise<TestResponse> {
    return this.request('GET', path, undefined, headers);
  }

  public async post(path: string, body?: any, headers: Record<string, string> = {}): Promise<TestResponse> {
    return this.request('POST', path, body, headers);
  }

  public async put(path: string, body?: any, headers: Record<string, string> = {}): Promise<TestResponse> {
    return this.request('PUT', path, body, headers);
  }

  public async delete(path: string, headers: Record<string, string> = {}): Promise<TestResponse> {
    return this.request('DELETE', path, undefined, headers);
  }

  public async request(
    method: string,
    path: string,
    body?: any,
    customHeaders: Record<string, string> = {}
  ): Promise<TestResponse> {
    // 1. Live server execution if baseUrl is active and app is not supplied
    if (this.baseUrl && !this.app) {
      const url = `${this.baseUrl}${path}`;
      const res = await fetch(url, {
        method,
        headers: {
          'content-type': 'application/json',
          ...customHeaders,
        },
        body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
      });

      const resHeaders: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        resHeaders[key.toLowerCase()] = value;
      });

      const text = await res.text();
      let resBody: any;
      try {
        resBody = JSON.parse(text);
      } catch {
        resBody = text;
      }

      return { status: res.status, headers: resHeaders, body: resBody };
    }

    // 2. In-Process Express execution (zero TCP socket, zero EACCES errors)
    if (!this.app) {
      throw new Error('[ApiTestClient] Neither app nor TEST_API_URL was provided.');
    }

    return new Promise<TestResponse>((resolve, reject) => {
      const headers: Record<string, string> = {
        'content-type': 'application/json',
        host: 'localhost',
        'x-forwarded-for': '127.0.0.1',
      };

      for (const [key, val] of Object.entries(customHeaders)) {
        headers[key.toLowerCase()] = val;
      }

      let payload: string | undefined;
      if (typeof body === 'string') {
        payload = body;
      } else if (body !== undefined && body !== null) {
        payload = JSON.stringify(body);
      }

      if (payload !== undefined) {
        headers['content-length'] = String(Buffer.byteLength(payload));
      }

      const socket = new net.Socket();
      const req = new http.IncomingMessage(socket);
      req.method = method;
      req.url = path;
      req.headers = headers;

      const res = new http.ServerResponse(req);
      let statusCode = 200;
      let rawOutput = '';
      let isResolved = false;

      const finish = () => {
        if (isResolved) return;
        isResolved = true;

        const effectiveHeaders = res.getHeaders ? (res.getHeaders() as Record<string, any>) : {};
        const normalizedHeaders: Record<string, string> = {};
        for (const [k, v] of Object.entries(effectiveHeaders)) {
          normalizedHeaders[k.toLowerCase()] = String(v);
        }

        let parsedBody: any = rawOutput;
        if (rawOutput) {
          try {
            parsedBody = JSON.parse(rawOutput);
          } catch {
            parsedBody = rawOutput;
          }
        } else {
          parsedBody = null;
        }

        resolve({
          status: res.statusCode || statusCode,
          headers: normalizedHeaders,
          body: parsedBody,
        });
      };

      const origWriteHead = res.writeHead.bind(res);
      res.writeHead = function (code: number, ...args: any[]): any {
        statusCode = code;
        return origWriteHead(code, ...args);
      };

      const origWrite = res.write.bind(res);
      res.write = function (chunk: any, ...args: any[]): any {
        if (chunk) {
          rawOutput += typeof chunk === 'string' ? chunk : chunk.toString('utf-8');
        }
        return origWrite(chunk, ...args);
      };

      const origEnd = res.end.bind(res);
      res.end = function (chunk?: any, ...args: any[]): any {
        if (chunk) {
          rawOutput += typeof chunk === 'string' ? chunk : chunk.toString('utf-8');
        }
        const ret = origEnd(chunk, ...args);
        finish();
        return ret;
      };

      try {
        this.app(req, res);
      } catch (err) {
        reject(err);
        return;
      }

      if (payload !== undefined) {
        req.push(payload);
      }
      req.push(null);
    });
  }
}
