import { CanActivate, ExecutionContext, mixin, Type, UnauthorizedException } from '@nestjs/common';

import { JwtAuthGuard } from './jwt-auth.guard';

import { Permission } from 'src/permission/entities/permission.entity';
import { Perfil } from 'src/perfil/entities/perfil.entity';
import { Usuario } from 'src/usuarios/entities/usuario.entity';
 
const PermissionGuard = (permission: any, allowContext: boolean = false): Type<CanActivate> => {
  class PermissionGuardMixin extends JwtAuthGuard {
    async canActivate(context: ExecutionContext): Promise<any> {
      const returnData = await super.canActivate(context);

      if (!returnData) {
        throw new UnauthorizedException('Não foi possível verificar autorização do Usuário.');        
      }
      
      // Armazena dados da requisição
      const request = context.switchToHttp().getRequest();
      // Armazena dados do usuario da requisição
      const usuario: Usuario = request.user;

      // Verifica se o usuário existe
      if (!usuario) {
        throw new UnauthorizedException('Usuário não encontrado.');
      }
      
      // Armazena parametros enviados na rota da requisição
      const params = request.params;
      // Armazena perfil do usuário
      const perfil: Perfil = usuario?.perfil;

      // Armazena lista de permissões de cada perfil do usuário
      const permissions: Permission[] = [];

      perfil.permission.forEach(per => {
        permissions.push(per);
      })

      // Verifica se o perfil e as permissões estão definidos
      if (!perfil || !perfil.permission) {
        throw new UnauthorizedException('Perfil ou permissões do usuário não encontrados.');
      }

      // Verifica se o usuario tem permissão para acessar a rota
			if (!(permissions.some(p => p.nome == permission)) && !(allowContext == true && params?.idPublic == usuario.idPublic)) {
        // Retorna mensagem de erro
        throw new UnauthorizedException('Usuário sem autorização.');
      }
      
      // Retorna true para sucesso
      return returnData;
    }
  }
	
  return mixin(PermissionGuardMixin);
}
 
export default PermissionGuard;