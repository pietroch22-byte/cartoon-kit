import numpy as np
from scipy.optimize import least_squares
W,H=1080,1920
def proj(p,cam):
    x,y,z,yaw,pitch,fov=cam
    cy,sy=np.cos(yaw),np.sin(yaw); cp,sp=np.cos(pitch),np.sin(pitch)
    f=np.array([sy*cp, sp, -cy*cp]); r=np.array([cy,0,sy]); u=np.cross(r,f)
    d=np.array(p)-np.array([x,y,z]); zc=d@f; xc=d@r; yc=d@u
    t=np.tan(np.radians(fov)/2); px=W/2+xc/zc/t/(W/H)*W/2; py=H/2-yc/zc/t*H/2
    return np.array([px,py])
pts=[((7,2.3,-2.8),(636,865)),((7,0,-2.8),(636,1105)),((7,2.3,-0.4),(800,845)),((7,0,-0.4),(800,1170))]
vp=(177,921)
def res(c):
    e=[]
    for P,q in pts: e+=list(proj(P,c)-q)
    far=proj((c[0]+np.sin(c[3])*0, c[1], c[2]-1e5),c)  # direction -z
    e+=list((far-vp)*0.5)
    return e
best=None
for x0 in [2,4,6]:
  for z0 in [4,8,12]:
    r=least_squares(res,[x0,1.7,z0,0.2,0.0,60],bounds=([-3,0.3,-1,-1,-0.6,20],[6.9,6,40,1,0.6,100]))
    if best is None or r.cost<best.cost: best=r
print(best.x, best.cost)
for P,q in pts: print(q, proj(P,best.x).round())
print('vp',proj((0,best.x[1],-1e5),best.x).round())
cam=best.x
def corners(s):
    cx,cy,cz,ry,w,h=s
    r=np.array([np.cos(ry),0,-np.sin(ry)])   # plane local +x after rotation.y=ry
    c=np.array([cx,cy,cz]); up=np.array([0,1,0])
    return [c-r*w/2+up*h/2, c+r*w/2+up*h/2, c-r*w/2-up*h/2, c+r*w/2-up*h/2]
tgt=[(570,120),(712,180),(570,830),(708,838)]
def rs(s): return np.concatenate([proj(p,cam)-q for p,q in zip(corners(s),tgt)])
b2=least_squares(rs,[5,6.5,-3.6,-0.2,1.3,6.5])
print('sign',b2.x.round(3),b2.cost)
# characters: feet y 1160 at x 600 and 740 -> find ground point
def ground(px,py):
    from scipy.optimize import fsolve
    f=lambda v: proj((v[0],0,v[1]),cam)-np.array([px,py])
    return fsolve(f,[5,-1])
for q in [(600,1160),(740,1160)]:
    g=ground(*q); top=proj((g[0],1.7,g[1]),cam); print('char',q,g.round(2),'head y',top.round())
print('canopy', [proj(p,cam).round() for p in [(7,2.62,-3.0),(7,2.62,-0.2)]])
b3=least_squares(rs,[5.5,4.5,-2.5,-0.4,1.3,4.5],bounds=([3.5,2.5,-6,-1.6,0.8,2.5],[6.9,9,0,1.6,2.0,9]))
print('sign2',b3.x.round(3),b3.cost, [proj(p,cam).round() for p in corners(b3.x)])
