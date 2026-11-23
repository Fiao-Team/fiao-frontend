import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { autenticacionInterceptor } from './servicios/autenticacion-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // Cliente HTTP para llamar a la API, con el interceptor que agrega el token.
    provideHttpClient(withInterceptors([autenticacionInterceptor])),
  ],
};
