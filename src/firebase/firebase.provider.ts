import { Provider } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { ConfigService } from '@nestjs/config';

export const FirebaseProvider: Provider = {
  provide: 'FIREBASE_ADMIN',
  useFactory: (configService: ConfigService) => {
    const firebaseConfig = {
      credential: admin.credential.cert({
        projectId: configService.get('firebase.projectId'),
        clientEmail: configService.get('firebase.clientEmail'),
        privateKey: configService
          .get('firebase.privateKey')
          ?.replace(/\\n/g, '\n'),
      }),
    };

    // Initialize Firebase Admin if not already initialized
    if (!admin.apps.length) {
      return admin.initializeApp(firebaseConfig);
    }
    return admin.app();
  },
  inject: [ConfigService],
};
