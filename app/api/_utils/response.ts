export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiFailure = {
  success: false;
  error: string;
};

export function ok<T>(data: T, status = 200): Response {
  return Response.json({ success: true, data } satisfies ApiSuccess<T>, {
    status,
  });
}

export function fail(error: string, status = 400): Response {
  return Response.json({ success: false, error } satisfies ApiFailure, {
    status,
  });
}
