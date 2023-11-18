export enum HttpStatusCodeEnum {
    Success = 200,

    BadRequest = 400,
    Missing = 404,

    ServerError = 500,
    ServiceUnavailable = 503,
}

export type HttpResult = {
    code: HttpStatusCodeEnum;
    value: string | Buffer;
};
