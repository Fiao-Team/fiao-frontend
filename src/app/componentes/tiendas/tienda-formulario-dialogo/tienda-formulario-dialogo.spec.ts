import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../../environments/environment';
import { TiendaItem } from '../../../modelo/tienda';
import { TiendaFormularioDialogo, generarContrasenaTemporal } from './tienda-formulario-dialogo';

const TIENDA_EXISTENTE: TiendaItem = {
  tienda_id: 7,
  nombre_comercial: 'Panadería San José',
  razon_social: null,
  ruc: '20456789123',
  giro: 'Panadería',
  direccion: 'Av. Universitaria 1200',
  distrito: 'Los Olivos',
  telefono: '987654321',
  dueno_dni: '40123456',
  dueno_nombres: 'María Torres',
  dueno_email: 'maria@sanjose.pe',
  dueno_username: 'sanjose',
  moneda_defecto: 'PEN',
  logo_url: null,
  estado: 1,
  clientes_count: 2,
};

describe('TiendaFormularioDialogo', () => {
  let http: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/tiendas`;

  beforeEach(async () => {
    if (!HTMLDialogElement.prototype.showModal) {
      HTMLDialogElement.prototype.showModal = function () {
        this.setAttribute('open', '');
      };
    }
    if (!HTMLDialogElement.prototype.close) {
      HTMLDialogElement.prototype.close = function () {
        this.removeAttribute('open');
      };
    }

    await TestBed.configureTestingModule({
      imports: [TiendaFormularioDialogo],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('genera contraseñas temporales de al menos 8 caracteres sin espacios', () => {
    const clave = generarContrasenaTemporal();
    expect(clave.length).toBeGreaterThanOrEqual(8);
    expect(/\s/.test(clave)).toBe(false);
  });

  it('muestra los mensajes de validación exactos de la Fig. 4 cuando los campos son inválidos', () => {
    const fixture = TestBed.createComponent(TiendaFormularioDialogo);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.abrirCrear();
    fixture.detectChanges();

    const form: HTMLFormElement = fixture.nativeElement.querySelector('form');
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    const texto = fixture.nativeElement.textContent as string;
    expect(texto).toContain('Ingresa el nombre comercial');
    expect(texto).toContain('Debe tener 11 dígitos y empezar con 10 o 20');
    expect(texto).toContain('Ingresa la dirección');
    expect(texto).toContain('Ingresa el distrito');
    expect(texto).toContain('Debe tener 9 dígitos');
    expect(texto).toContain('Selecciona un giro');
    expect(texto).toContain('Ingresa nombres y apellidos');
    expect(texto).toContain('Debe tener 8 dígitos');
    expect(texto).toContain('Ingresa un correo válido');
    expect(texto).toContain('Mínimo 3 caracteres');
    expect(texto).toContain('Mínimo 8 caracteres');
  });

  it('mapea los errores por campo devueltos por el backend (HTTP 400)', () => {
    const fixture = TestBed.createComponent(TiendaFormularioDialogo);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.abrirCrear();
    (comp as any).formulario.setValue({
      nombre_comercial: 'Panadería San José',
      ruc: '20456789123',
      direccion: 'Av. Universitaria 1200',
      distrito: 'Los Olivos',
      telefono: '987654321',
      giro: 'Panadería',
      moneda_defecto: 'PEN',
      logo_url: '',
      dueno_nombres: 'María Torres',
      dueno_dni: '40123456',
      dueno_email: 'maria@sanjose.pe',
      username: 'sanjose',
      password: 'ClaveSegura123',
    });
    fixture.detectChanges();

    (comp as any).guardar();
    const req = http.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    req.flush(
      {
        detail: 'RUC ya registrado',
        errores: {
          ruc: 'RUC ya registrado',
          username: 'Usuario ya existe',
        },
      },
      { status: 400, statusText: 'Bad Request' },
    );
    fixture.detectChanges();

    const texto = fixture.nativeElement.textContent as string;
    expect(texto).toContain('RUC ya registrado');
    expect(texto).toContain('Usuario ya existe');
  });

  it('permite editar una tienda existente con PUT sin pedir contraseña', () => {
    const fixture = TestBed.createComponent(TiendaFormularioDialogo);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    let emitida: TiendaItem | undefined;
    comp.guardado.subscribe((t) => (emitida = t));

    comp.abrirEditar(TIENDA_EXISTENTE);
    (comp as any).formulario.controls.nombre_comercial.setValue('Panadería San José Central');
    fixture.detectChanges();

    (comp as any).guardar();
    const req = http.expectOne(`${baseUrl}/7`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.nombre_comercial).toBe('Panadería San José Central');
    expect('username' in req.request.body).toBe(false);
    expect('password' in req.request.body).toBe(false);
    req.flush({ ...TIENDA_EXISTENTE, nombre_comercial: 'Panadería San José Central' });

    expect(emitida?.nombre_comercial).toBe('Panadería San José Central');
  });
});
