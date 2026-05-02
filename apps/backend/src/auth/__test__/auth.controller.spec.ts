import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { SignDto } from '../dto/sign.dto';

describe('AuthController（登录认证模块-控制器）', () => {
  let controller: AuthController;
  let mockAuthService: Pick<AuthService, 'signIn'>;

  beforeEach(async () => {
    // 模拟的AuthService -> 与后续的依赖项UserService等无关联的依赖项
    mockAuthService = {
      signIn: (username: string, password: string) => {
        console.log(username, password);
        return Promise.resolve({ token: 'token' });
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
      // providers: [AuthService]
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('鉴权-初始化-实例化', () => {
    expect(controller).toBeDefined();
  });

  it('鉴权-控制器-signin注册', async () => {
    const res = await controller.signIn({
      username: 'test',
      password: '123456',
    } as SignDto);
    expect(res).not.toBeNull();
    expect(res.data.token).toBe('token');
  });
});
