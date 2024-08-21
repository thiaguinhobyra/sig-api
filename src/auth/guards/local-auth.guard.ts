import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';


@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  async canActivate(context: ExecutionContext): Promise<any> {
    const request = context.switchToHttp().getRequest();
    
    if (!request.body.email || !request.body.senha) {
      throw new UnauthorizedException('Credenciais de acesso não informadas.');
    }

    return await super.canActivate(context);
  }
}