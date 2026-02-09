import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { PersistingService } from '../../auth/services/persisisting.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const persistingService = inject(PersistingService);
  const currentUser = persistingService.currentUser();

  if (currentUser?.token) {
    const clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${currentUser.token}`,
      },
    });
    return next(clonedRequest);
  }

  return next(req);
};
