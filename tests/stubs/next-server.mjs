/**
 * `next/server` stand-in. Only what src/middleware.ts touches: NextResponse.redirect,
 * NextResponse.next, and NextRequest's `nextUrl` / `url` reads.
 */
export class NextRequest {
  constructor(url, headers = {}) {
    this.url = url;
    this.nextUrl = new URL(url);
    this.headers = new Headers(headers);
  }
}

export class NextResponse {
  constructor(status, headers = {}) {
    this.status = status;
    this.headers = new Headers(headers);
  }

  static redirect(target, status = 307) {
    const location = target instanceof URL ? target.toString() : String(target);
    return { kind: "redirect", status, location, headers: new Headers({ location }) };
  }

  static next(init = {}) {
    return { kind: "next", status: 200, headers: new Headers(init.headers ?? {}) };
  }

  static rewrite(target) {
    return { kind: "rewrite", location: String(target) };
  }

  static json(body, init = {}) {
    return { kind: "json", body, status: init.status ?? 200 };
  }
}
