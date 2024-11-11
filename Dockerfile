FROM node:18-alpine AS builder

WORKDIR /usr/src/app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package*.json pnpm-lock.yaml ./
RUN pnpm install

# Copy source code
COPY . .

# Build application
RUN pnpm build

# Production stage
FROM node:18-alpine

WORKDIR /usr/src/app
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY package*.json ./

# Set environment variables
ENV PORT=3000
ENV NODE_ENV=development
ENV MONGODB_URI="mongodb+srv://blockvest:blockvest@cluster0.o7tcp72.mongodb.net/"
ENV JWT_SECRET="khjhdkjhsakjadhaks09890jdij&&^&^&^&IOKJKJIUIU++ijijijidhjnasknjc88cha8aya8y&^&*"
ENV JWT_EXPIRES_IN="3d"
ENV FIREBASE_PROJECT_ID="blockvest-acfc0"
ENV FIREBASE_CLIENT_EMAIL="firebase-adminsdk-8f236@blockvest-acfc0.iam.gserviceaccount.com"
ENV FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC2QoTGfOzgFUB5\nKM8tm6iOjxJ7PvUKu2xnovmLzxHy2vUB1M24fGTFNvXLmKM9+EUvud9bafMRbjyr\nhTiPVmwyj6rJRhHD5Ggb2qI4tgrYsFj4o4+eSOqvZ3K4hBk4qZ1PazPT7POy29Dm\n/3HYv9hwaKIZaaWCzlNBDjNCBF/UhINNzix9Ck59fpbhaL3TrgueCnhmWo/K78ct\ngszf5RbcQLNg0uwkoCLyvuNGPi3kV5CvYf5A2kOlYGOItMHGvIrqQg49kt5jlNl5\nNneQYhQo6rlRygjYZjGcujS2DouFSc7jhRyumDSP86HkAsWkb2NLF7ZaoqCMrztM\ndZCDLEMZAgMBAAECggEAAMz+ZizZskGTQ47h8BlA3zQRKfmrc/D60h5s6RpRevRf\nnYn0eL+lYD+s6HwxeIUPQRkrmaV+hTHUWQFAN+sLDT9vG52HuidDJsUy3IlkeI1A\nAg3yVh68s5uwzxuItFK1LKGeu2Ae8eTtuhkm33jEZETDddAk3S9NebL+YP/EeWEU\nYldluDOCGChnWAgegjbHnxwnMToPWa6YwMPNWZO0kj2IARJ+5aE7RYUUw8vBiquZ\nfwHfDkw+8iQ2ENRNFtGzZR8q+fOPFs0LFkxUEzZhHO+mhIcQXIQ88yDvxcQPCZVd\nbaH4BNtGCOB49qlcmq5oVrllK0ZIr7yIraAx9g1G3QKBgQD6erSNqZTcSy1OoKnN\n3BvZM41QmKLvVubT7hisIJPIzcLMh/5MIzosKOm59361cTzGnJxm0vZHTrNJ1t94\nh5dgHvhW/tIBo0hU/8EVoiABWlqRNwkl6rvNLUsS6AGsRhqcnInjwypI/ktCrIVR\n7/orsO9P4WJ6O4WB4awO/kcyNwKBgQC6RuT6TgaddBB2a3uzKAGcgR/fi2EK5mos\neI9sm1h5mCvQEHll6gQ25CdimijqMfZXFmrsnLmVsUyJFAGfrwkEkeLQ8QWDUIQL\nAl4kgArjRb2beHq/Ul/5vZEP2kTodK6492eypxaG7kIUbukd3ERgFI78at5PKLZX\niFCxVDzNLwKBgQCTVhZatgPgSUBPXeZEN1MSQma/n+lHy+BfjVBp/4euuIn7cYs+\nEgKn8zD4uQKJjCBp27mMKk+/xiVkK8aryWZbnhwKYD37xKZJiV90cDdPVGytuqfg\n6+CoYhok9t/1DA+fS904Ypa+9QYkJAMQHY8UoDFE1ZjtuZFgwvRIpX4PpQKBgA35\nC2wLNkvRTPrVDS5fLd/Df9SQ6/KZXhV/5aJL9NMKKx8sXS7b4v0LGDk5PyByJvxZ\nXiPpjbJA3nDZ41VLF+4T02PA8JztCTqaLt2mDSsHLDXhT7PSRgjBw4Pg55JYTlLp\nnAm2puXwMVy/BRWMVESwxhkBGzPs5eCjBQqIOxdZAoGACWKoABeEz2yVWG1qxeQa\nW+R+8JXNs5VinxH5Svf6dXc3mrg2sqO7f2mTZfN2sIZo7XzdhJT8ssH6MO02xwNS\noCeBa8fP5tiuG7H0FSr5bHue85vFiBf1iR7EZNOBhhA3HkWBdFOtUrU6dgSxNiXN\n11YQSD9DvOj9XV/Crrj9WPA=\n-----END PRIVATE KEY-----\n"

EXPOSE 3000
CMD ["node", "dist/main"]