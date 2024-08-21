import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Usuario } from 'src/usuarios/entities/usuario.entity';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { IdDto } from 'src/utils/id.dto';
import { LoginUsuarioDto } from 'src/usuarios/dto/login-usuario.dto';

@Injectable()
export class AuthService {
	constructor(
		private jwtService: JwtService,
		private dataSource: DataSource
	) { }

	async validateUser(email: string, senha: string): Promise<any> {
		const usuario = await this.dataSource.getRepository(Usuario).findOne({
			where: {
				email
			},
			select: ['id', 'idPublic', 'nome', 'email', 'senha', 'ativo', 'redefinirPass', 'firstAccess', 'lastAccess', 'perfil', 'setor', 'createdAt', 'updatedAt'],
			relations: {
				perfil: {
					permission: true
				},
				setor: {
					orgao: true
				}
			},
			loadEagerRelations: false
		});

		if (!usuario) {
			throw new UnauthorizedException('Usuário e/ou senha incorretos.');
		}

		if (!usuario.ativo) {
			throw new UnauthorizedException('Seu usuário está inativo.');
		}

		if (usuario.redefinirPass) {
			throw new UnauthorizedException('É necessário redefinir a sua senha.');
		}

		const body = {
			firstAccess: usuario.firstAccess || new Date(new Date().setHours(new Date().getHours() - 3)),
			lastAccess: new Date(new Date().setHours(new Date().getHours() - 3)),
			updatedAt: usuario.updatedAt
		}

		const usuarioReturn = await bcrypt.compare(senha, usuario.senha).then(async (result) => {
			if (result) {
				await this.dataSource.getRepository(Usuario).update({ id: usuario.id }, body)

				const user = await this.dataSource.getRepository(Usuario).findOne({
					loadEagerRelations: false,
					select: ['id', 'idPublic', 'nome', 'email', 'setor', 'ativo', 'redefinirPass', 'firstAccess', 'lastAccess', 'perfil', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy', 'dataDelete'],
					where: {
						id: usuario.id
					},
					relations: {
						perfil: {
							permission: true
						},
						setor: {
							orgao: true
						}
					}
				});

				return user;
			}

			throw new UnauthorizedException('Usuário e/ou senha incorretos.');
		});

		return usuarioReturn;
	}

	async login(usuario: LoginUsuarioDto) {
		const usuarioReturn: Usuario = await this.dataSource.getRepository(Usuario).findOne({
			loadEagerRelations: false,
			where: {
				email: usuario.email
			},
			relations: {
				perfil: {
					permission: true
				},
				setor: {
					orgao: true
				}
			}
		});

		const payload = { userId: usuarioReturn.id, email: usuarioReturn.email };

		const token = this.jwtService.sign(payload);

		return {
			access_token: token,
			usuario: usuarioReturn
		};
	}

	async loginToken(userToken: IdDto) {
		const usuarioReturn: Usuario = await this.dataSource.getRepository(Usuario).findOne({
			loadEagerRelations: false,
			select: ['id', 'idPublic', 'nome', 'email', 'setor', 'ativo', 'redefinirPass', 'firstAccess', 'lastAccess', 'perfil', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy', 'dataDelete'],
			where: {
				id: userToken.id
			},
			relations: {
				perfil: {
					permission: true
				},
				setor: {
					orgao: true
				}
			}
		});

		const payload = { userId: usuarioReturn.id, email: usuarioReturn.email };

		const token = this.jwtService.sign(payload);

		return {
			access_token: token,
			usuario: usuarioReturn
		};
	}
}