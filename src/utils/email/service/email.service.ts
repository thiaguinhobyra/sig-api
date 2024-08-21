import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

import { JwtService } from '@nestjs/jwt';
import { Payload } from 'src/utils/email/interface/payload.interface';
import { EmailDto } from './../dto/email.dto';

@Injectable()
export class EmailService {
	constructor(
		private httpService: HttpService,
		private jwtService: JwtService
	) { }

	async sendMail(body: EmailDto) {
		try {
			const options = {
				headers: {
					'Authorization': 'Basic ' + process.env.EMAIL_API_TOKEN,
					'Content-Type': 'application/json',
					'Accept-Encoding': '*'
				}
			}

			const resp = await firstValueFrom(this.httpService.post(process.env.EMAIL_API_URL, body, options))

			if (resp.status != 200) {
				throw new Error;
			}

			return resp.data.data;
		} catch (error) {
			throw 'Não foi possível enviar o E-mail. ';
		}
	}

	public async decodeConfirmationToken(token: string): Promise<Payload> {
		try {
			const payload = await this.jwtService.verify(token, {
				secret: process.env.SECRET_KEY_EMAIL,
			});

			if (!(typeof payload === 'object' && 'email' in payload)) {
				throw 'Token de confirmação de e-mail inválido.';
			}

			return payload;
		} catch (error) {

			switch (error?.name) {
				case 'TokenExpiredError':
					error = 'Token de confirmação de e-mail expirado.';
					break;

				case 'JsonWebTokenError':
					error = 'Token inválido.'
					break;

				default:
					error = 'Erro ao confirmar o token.'
					break;
			}

			throw new HttpException({ message: 'Não foi possível confirmar o Token. ', code: error?.code, erro: error }, HttpStatus.NOT_FOUND);
		}
	}
}