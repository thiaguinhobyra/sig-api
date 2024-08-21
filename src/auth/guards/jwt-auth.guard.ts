import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<any> {
    const returnData = await super.canActivate(context);
    
    // Armazena dados da requisição
    const request = context.switchToHttp().getRequest();
    // Armazena metodo da requisição
    const method = request.method;
    // Armazena corpo da requisição
    const body = request.body;
    // Armazena usuário do token no corpo
    request.body.userToken = request.user;

    // Define no corpo assinatura do autor da ação de acordo com o metodo da requisição
    switch (method) {
      // Verifica se o metodo da requisição é um POST
      case 'POST':
        // Deifine a assinatura do usuario em createBy do corpo
        body.createdBy = request.user.idPublic;
        // Para verificação do switch
        break;
        // Verifica se o metodo da requisição é um PATCH ou DELETE
      case 'PATCH':
      case 'DELETE':
        // Deifine a assinatura do usuario em updateBy do corpo
        body.updatedBy = request.user.idPublic;
        // Para verificação do switch
        break;
    }
    
    return returnData;
  }

  handleRequest(err, user) {
    if (err || !user) {
      throw err || new UnauthorizedException('Login necessário.');
    }

    return user;
  }
}