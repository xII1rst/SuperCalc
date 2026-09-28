function finiteNumbers(values) {
  if (values.some(value => !Number.isFinite(value))) {
    throw new RangeError('Todos los valores deben ser números finitos.');
  }
}

export function linearMotion(position, velocity, acceleration, time) {
  finiteNumbers([position, velocity, acceleration, time]);
  if (time < 0) throw new RangeError('El tiempo no puede ser negativo.');
  const displacement = velocity * time + acceleration * time * time / 2;
  const finalPosition = position + displacement;
  const finalVelocity = velocity + acceleration * time;
  finiteNumbers([displacement, finalPosition, finalVelocity]);
  return { displacement, finalPosition, finalVelocity };
}

export function projectileMotion(speed, angleDeg, height = 0, gravity = 9.81) {
  finiteNumbers([speed, angleDeg, height, gravity]);
  if (speed < 0 || angleDeg < -90 || angleDeg > 90 || height < 0 || gravity <= 0) {
    throw new RangeError('Usa rapidez y altura no negativas, ángulo entre −90° y 90° y gravedad positiva.');
  }
  const angle = angleDeg * Math.PI / 180;
  const vx = speed * Math.cos(angle);
  const vy = speed * Math.sin(angle);
  const discriminant = vy * vy + 2 * gravity * height;
  const flightTime = (vy + Math.sqrt(discriminant)) / gravity;
  const range = vx * flightTime;
  const maxHeight = height + Math.max(vy, 0) ** 2 / (2 * gravity);
  finiteNumbers([vx, vy, flightTime, range, maxHeight]);
  const points = Array.from({length: 81}, (_, index) => {
    const time = flightTime * index / 80;
    return {x: vx * time, y: Math.max(0, height + vy * time - gravity * time * time / 2)};
  });
  points[points.length - 1].y = 0;
  return {vx, vy, flightTime, range, maxHeight, points};
}

export function forceAndEnergy(mass, acceleration, speed, height, gravity = 9.81) {
  finiteNumbers([mass, acceleration, speed, height, gravity]);
  if (mass < 0 || speed < 0 || height < 0 || gravity <= 0) {
    throw new RangeError('Usa masa, rapidez y altura no negativas y gravedad positiva.');
  }
  const force = mass * acceleration;
  const kinetic = mass * speed * speed / 2;
  const potential = mass * gravity * height;
  const total = kinetic + potential;
  finiteNumbers([force, kinetic, potential, total]);
  return {force, kinetic, potential, total};
}
