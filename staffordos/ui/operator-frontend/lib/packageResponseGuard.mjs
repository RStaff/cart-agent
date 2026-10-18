export function createPackageResponseGuard() {
  let currentToken = 0;
  return {
    begin(selection) { return { selection, token: ++currentToken }; },
    accepts(request, selection) { return request?.selection === selection && request.token === currentToken; },
  };
}
