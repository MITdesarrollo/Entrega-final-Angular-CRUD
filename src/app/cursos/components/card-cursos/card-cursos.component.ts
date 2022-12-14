import { Component, OnDestroy, OnInit } from '@angular/core';
import { Curso } from '../../models/curso';
import { forkJoin, map, Observable, Subscription } from 'rxjs';
import { Sesion } from '../../../login/models/sesion';
import { CursoService } from '../../services/curso.service';
import { SesionService } from '../../../core/services/sesion.service';
import { Router } from '@angular/router';
import { AlumnosService } from 'src/app/alumnos/service/alumnos.service';
import { Store } from '@ngrx/store';
import { CursoState } from '../../models/curso.state';
import {
  loadCursoss,
  loadCursossFailure,
  loadCursossSuccess,
  eliminarCurso,
} from 'src/app/cursos/state/cursos.actions';
import { selectCursos } from 'src/app/cursos/state/cursos.selectors';
import Swal from 'sweetalert2';
import { Alumno } from 'src/app/alumnos/models/alumnos';

@Component({
  selector: 'app-card-cursos',
  templateUrl: './card-cursos.component.html',
  styleUrls: ['./card-cursos.component.scss'],
})
export class CardsCursosComponent implements OnInit, OnDestroy {
  deshabilitado: boolean = false;

  cursos$!: Observable<Curso[]>;

  sesion!: Sesion;
  sesionSubcription!: Subscription;
  sesion$!: Observable<Sesion>;

  datosAlumno!: Alumno;

  alumnos$!: Observable<Alumno[]>;
  alumnosSubs!: Subscription;
  alumnos!: Alumno[];

  nameUsuario!: any;
  constructor(
    private store: Store<CursoState>,
    private cursosService: CursoService,
    private sesionService: SesionService,
    private alumnoService: AlumnosService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cursos$ = this.store.select(selectCursos);

    this.store.dispatch(loadCursoss());

    this.sesion$ = this.sesionService.obtenerDatosSesion();
    this.sesionSubcription = this.sesion$.subscribe(
      (sesion) => (this.sesion = sesion)
    );
  }

  ngOnDestroy(): void {
    this.sesionSubcription.unsubscribe();
  }

  obtenerCursoAInscribirse(id: number) {
    this.deshabilitado = true;
    setTimeout(() => {
      this.deshabilitado = false;
    }, 3000);

    this.alumnos$ = this.alumnoService.obtenerAlumnos();
    this.alumnosSubs = this.alumnos$.subscribe((el) => {
      let alumnoEcontrado = el.find(
        (el) => el.nameUsuario === this.sesion.usuarioActivo?.usuario
      );

      if (alumnoEcontrado) {
        let nameUsuario = this.sesion.usuarioActivo?.usuario;
        let datoCurso$: Observable<any> = this.cursosService.obtenerCurso(id);
        let datoAlumno$: Observable<any> =
          this.alumnoService.obtenerAlumno(nameUsuario);

        forkJoin({ datoAlumno$, datoCurso$ }).subscribe((el) => {
          let datoAlumno = el.datoAlumno$[0];
          let datoCurso = el.datoCurso$;

          let yaInscripto = datoCurso.inscriptos.find(
            (el: any) => el.nameUsuario === datoAlumno.nameUsuario
          );

          if (yaInscripto === undefined) {
            datoCurso.inscriptos = [...datoCurso.inscriptos, datoAlumno];
            this.cursosService.editarCurso(datoCurso);
            Swal.fire({
              position: 'center',
              icon: 'success',
              title: 'Alta exitosa',
              showConfirmButton: false,
              timer: 1500,
            });
          } else {
            Swal.fire({
              position: 'center',
              icon: 'error',
              title: 'Ya estas inscripto a este curso',
              showConfirmButton: false,
              timer: 1500,
            });
          }
        });
      } else {
        Swal.fire({
          position: 'center',
          icon: 'error',
          title: 'Debes darte de alta',
          showConfirmButton: false,
          timer: 1500,
        });
        setTimeout(() => {
          this.router.navigate(['students/alta-alumno']);
        }, 1600);
      }
    });
  }

  editarCurso(curso: Curso) {
    this.router.navigate(['/courses/edit-course', curso]);
  }

  eliminarCurso(curso: Curso) {
    this.store.dispatch(eliminarCurso({ curso }));
  }

  /* metodos filtrado tablas */
  filtrarCurso(event: Event) {
    const valorObtenido = (event.target as HTMLInputElement).value;

    /* columna en especifico , filterPredicate lleva dos parametros*/
    this.cursos$ = this.cursosService
      .obtenerCursos()
      .pipe(
        map((c) =>
          c.filter((curso) =>
            curso.nombreCurso
              .toLocaleLowerCase()
              .includes(valorObtenido.toLocaleLowerCase())
          )
        )
      );
  }
}
