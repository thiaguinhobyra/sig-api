import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { EmailService } from './service/email.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
		imports: [
			HttpModule,
			JwtModule.register({})
		],
		providers: [EmailService],
		exports: [EmailService]
})
export class EmailModule {}